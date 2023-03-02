/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode } from 'langium';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ModelService } from './model-service';
import { OpenTextDocumentManager } from './open-text-document-manager';
import { OpenableTextDocuments } from './openable-text-documents';
import { Serializer } from './serializer';

export interface AddedSharedModelServices {
   workspace: {
      /* override */ TextDocuments: OpenableTextDocuments<TextDocument>;
      TextDocumentManager: OpenTextDocumentManager;
   };
}

export interface ModelServices {
   serializer: {
      Serializer: Serializer<AstNode>;
   };
   model: {
      ModelService: ModelService;
   };
}

export interface ModelLSPServices {
   shared: AddedSharedModelServices;
   language: ModelServices;
}
