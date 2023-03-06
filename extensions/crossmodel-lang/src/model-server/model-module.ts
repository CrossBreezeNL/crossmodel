/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { TextDocument } from 'vscode-languageserver-textdocument';
import { ModelService } from './model-service';
import { OpenTextDocumentManager } from './open-text-document-manager';
import { OpenableTextDocuments } from './openable-text-documents';

export interface AddedSharedModelServices {
   workspace: {
      /* override */ TextDocuments: OpenableTextDocuments<TextDocument>;
      TextDocumentManager: OpenTextDocumentManager;
   };
   model: {
      ModelService: ModelService;
   };
}
