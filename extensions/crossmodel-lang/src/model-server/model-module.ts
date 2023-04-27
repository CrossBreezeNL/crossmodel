/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { TextDocument } from 'vscode-languageserver-textdocument';
import { ModelService } from './model-service';
import { OpenTextDocumentManager } from './open-text-document-manager';
import { OpenableTextDocuments } from './openable-text-documents';

/**
 * Extension to the default shared model services by Langium.
 */
export interface AddedSharedModelServices {
   workspace: {
      /* override */ TextDocuments: OpenableTextDocuments<TextDocument>; // more accessible text document store
      TextDocumentManager: OpenTextDocumentManager; // open text document facade used by the model service
   };
   model: {
      ModelService: ModelService; // facade to access the Langium semantic models without being a language client
   };
}
