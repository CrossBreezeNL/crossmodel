/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   ClientSession,
   ClientSessionListener,
   ClientSessionManager,
   GLSPServerError,
   Logger,
   MaybePromise,
   RequestModelAction,
   SOURCE_URI_ARG,
   SaveModelAction,
   SourceModelStorage
} from '@eclipse-glsp/server';
import { inject, injectable, postConstruct } from 'inversify';
import { findRootNode, streamReferences } from 'langium';
import { URI } from 'vscode-uri';
import { isCrossModelRoot } from '../../language-server/generated/ast';
import { CrossModelState } from './cross-model-state';

/**
 * Model storage implementation that loads the model through the ModelService extension in our language services.
 * This way we ensure that during loading we get the latest up-to-date version from the central language storage and
 * any saved changes are properly synced back to it.
 */
@injectable()
export class CrossModelStorage implements SourceModelStorage, ClientSessionListener {
   @inject(Logger) protected logger: Logger;
   @inject(CrossModelState) protected state: CrossModelState;
   @inject(ClientSessionManager) protected sessionManager: ClientSessionManager;

   @postConstruct()
   protected init(): void {
      this.sessionManager.addListener(this, this.state.clientId);
   }

   async loadSourceModel(action: RequestModelAction): Promise<void> {
      // load semantic model from document in language model service
      const sourceUri = this.getSourceUri(action);
      const rootUri = URI.file(sourceUri).toString();
      const root = await this.state.modelService.request(rootUri, isCrossModelRoot);
      if (!root || !root.diagram) {
         throw new GLSPServerError('Expected CrossModal Diagram Root');
      }
      this.state.setSemanticRoot(rootUri, root);
   }

   saveSourceModel(action: SaveModelAction): MaybePromise<void> {
      const saveUri = this.getFileUri(action);

      // save document and all related documents
      this.state.modelService.save(saveUri, this.state.semanticRoot);
      streamReferences(this.state.semanticRoot)
         .map(refInfo => refInfo.reference.ref)
         .nonNullable()
         .map(ref => findRootNode(ref))
         .forEach(root => this.state.modelService.save(root.$document!.uri.toString(), root));
   }

   sessionDisposed(_clientSession: ClientSession): void {
      // close loaded document for modification
      this.state.modelService.close(this.state.semanticUri);
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
