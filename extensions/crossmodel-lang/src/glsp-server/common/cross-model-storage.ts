/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   ActionDispatcher,
   ClientSession,
   ClientSessionListener,
   ClientSessionManager,
   Disposable,
   DisposableCollection,
   GLSPServerError,
   Logger,
   MaybePromise,
   ModelSubmissionHandler,
   RequestModelAction,
   SOURCE_URI_ARG,
   SaveModelAction,
   SourceModelStorage
} from '@eclipse-glsp/server';
import { inject, injectable, postConstruct } from 'inversify';
import { findRootNode, streamReferences } from 'langium';
import { URI } from 'vscode-uri';
import { CrossModelRoot, isCrossModelRoot } from '../../language-server/generated/ast.js';
import { CrossModelState } from './cross-model-state.js';

/**
 * Model storage implementation that loads the model through the ModelService extension in our language services.
 * This way we ensure that during loading we get the latest up-to-date version from the central language storage and
 * any saved changes are properly synced back to it.
 */
@injectable()
export class CrossModelStorage implements SourceModelStorage, ClientSessionListener {
   @inject(Logger) protected logger!: Logger;
   @inject(CrossModelState) protected state!: CrossModelState;
   @inject(ClientSessionManager) protected sessionManager!: ClientSessionManager;
   @inject(ModelSubmissionHandler) protected submissionHandler!: ModelSubmissionHandler;
   @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

   protected toDispose = new DisposableCollection();

   @postConstruct()
   protected init(): void {
      this.sessionManager.addListener(this, this.state.clientId);
   }

   async loadSourceModel(action: RequestModelAction): Promise<void> {
      // load semantic model from document in language model service
      const sourceUri = this.getSourceUri(action);
      const rootUri = URI.file(sourceUri).toString();
      await this.state.modelService.open({ uri: rootUri, clientId: this.state.clientId });
      this.toDispose.push(Disposable.create(() => this.state.modelService.close({ uri: rootUri, clientId: this.state.clientId })));
      const root = await this.state.modelService.request(rootUri, isCrossModelRoot);
      this.state.setSemanticRoot(rootUri, root);
      this.toDispose.push(
         this.state.modelService.onUpdate<CrossModelRoot>(rootUri, async event => {
            if (this.state.clientId !== event.sourceClientId || event.reason !== 'changed') {
               this.state.setSemanticRoot(rootUri, event.model);
               this.actionDispatcher.dispatchAll(await this.submissionHandler.submitModel('external'));
            }
         })
      );
   }

   saveSourceModel(action: SaveModelAction): MaybePromise<void> {
      const saveUri = this.getFileUri(action);

      // save document and all related documents
      this.state.modelService.save({ uri: saveUri, model: this.state.semanticRoot, clientId: this.state.clientId });
      streamReferences(this.state.semanticRoot)
         .map(refInfo => refInfo.reference.ref)
         .nonNullable()
         .map(ref => findRootNode(ref))
         .forEach(root =>
            this.state.modelService.save({ uri: root.$document!.uri.toString(), model: root, clientId: this.state.clientId })
         );
   }

   sessionDisposed(_clientSession: ClientSession): void {
      this.toDispose.dispose();
   }

   protected getSourceUri(action: RequestModelAction): string {
      const sourceUri = action.options?.[SOURCE_URI_ARG];
      if (typeof sourceUri !== 'string') {
         throw new GLSPServerError(`Invalid RequestModelAction! Missing argument with key '${SOURCE_URI_ARG}'`);
      }
      return sourceUri;
   }

   protected getFileUri(action: SaveModelAction): string {
      const uri = action.fileUri ?? this.state.get(SOURCE_URI_ARG);
      if (!uri) {
         throw new GLSPServerError('Could not derive fileUri for saving the current source model');
      }
      return uri;
   }
}
