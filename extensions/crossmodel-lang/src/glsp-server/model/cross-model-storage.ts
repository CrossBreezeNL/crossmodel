/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   GLSPServerError,
   Logger,
   MaybePromise,
   RequestModelAction,
   SaveModelAction,
   SourceModelStorage,
   SOURCE_URI_ARG
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { AstNode, findRootNode, LangiumDocument, streamReferences } from 'langium';
import { URI } from 'vscode-uri';
import { CrossModelRoot, isCrossModelRoot } from '../../language-server/generated/ast';
import { CrossModelState } from './cross-model-state';

@injectable()
export class CrossModelStorage implements SourceModelStorage {
   @inject(CrossModelState) protected state: CrossModelState;
   @inject(Logger) protected logger: Logger;

   async loadSourceModel(action: RequestModelAction): Promise<void> {
      // load semantic model
      const sourceUri = this.getSourceUri(action);
      const document = this.state.services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(sourceUri));
      const root = document.parseResult.value;
      if (!isCrossModelRoot(root)) {
         throw new GLSPServerError('Unexpected root');
      }

      let diagramDocument = document;
      if (!root.diagram) {
         // let's check if there is an existing diagram or we will create one on the fly
         const diagramPath = document.uri.fsPath.split('.').slice(0, -1).join('.') + '.diagram.cm';
         const diagramUri = URI.file(diagramPath);
         const diagramString = this.state.services.language.serializer.CrossModelSerializer.asDiagram(root);
         diagramDocument = this.state.services.shared.workspace.LangiumDocumentFactory.fromString(diagramString, diagramUri);
         // do we need to call the builder? it indexes the file but also does linking and scope computation
         // probably no risk as diagrams are self-contained and do not export any objects anyway
         await this.state.services.shared.workspace.DocumentBuilder.build([diagramDocument]);
      }
      this.state.document = diagramDocument as LangiumDocument<CrossModelRoot>;
   }

   saveSourceModel(action: SaveModelAction): MaybePromise<void> {
      const saveUri = this.getFileUri(action);

      // save document and all related documents
      this.saveDocument(this.state.semanticRoot, URI.file(saveUri));
      streamReferences(this.state.semanticRoot)
         .map(refInfo => refInfo.reference.ref)
         .nonNullable()
         .map(ref => findRootNode(ref))
         .forEach(root => this.saveDocument(root));
   }

   protected saveDocument(root: AstNode, uri: URI = root.$document!.uri): void {
      const newContent = this.state.services.language.serializer.CrossModelSerializer.serialize(this.state.semanticRoot);

      // probably need to extend file service from LSP to support writing
      // this.state.services.shared.workspace.FileSystemProvider
      this.logger.info('SAVE', uri, newContent);
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
