/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, DocumentBuilder, isAstNode, isReference, LangiumDefaultSharedServices, LangiumDocuments } from 'langium';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { AddedSharedModelServices, ModelServices } from './model-module';
import { OpenTextDocumentManager } from './open-text-document-manager';
import { Serializer } from './serializer';

export class ModelService {
   protected serializer: Serializer<AstNode>;
   protected documentManager: OpenTextDocumentManager;
   protected documents: LangiumDocuments;
   protected documentBuilder: DocumentBuilder;

   constructor(modelServices: ModelServices, shared: AddedSharedModelServices & LangiumDefaultSharedServices) {
      this.serializer = modelServices.serializer.Serializer;
      this.documentManager = shared.workspace.TextDocumentManager;
      this.documents = shared.workspace.LangiumDocuments;
      this.documentBuilder = shared.workspace.DocumentBuilder;
   }

   async open(uri: string): Promise<void> {
      await this.documentManager.open(uri);
   }

   async close(uri: string): Promise<void> {
      await this.documentManager.close(uri);
   }

   async request(uri: string): Promise<AstNode | undefined> {
      await this.open(uri);
      const document = this.documents.getOrCreateDocument(URI.parse(uri));
      const root = document.parseResult.value;
      return isAstNode(root) ? cleanLangiumElement(root) : undefined;
   }

   async update(uri: string, model: AstNode): Promise<void> {
      await this.open(uri);
      const document = this.documents.getOrCreateDocument(URI.parse(uri));
      const root = document.parseResult.value;
      if (!isAstNode(root)) {
         throw new Error(`No AST node to update exists in '${uri}'`);
      }

      const text = this.serializer.serialize(model);
      const version = document.textDocument.version + 1;

      TextDocument.update(document.textDocument, [{ text }], version);
      await this.documentManager.update(uri, version, text);
      await this.documentBuilder.update([URI.parse(uri)], []);
   }

   async save(uri: string, model: AstNode): Promise<void> {
      const text = this.serializer.serialize(model);
      await this.documentManager.save(uri, text);
   }
}

export function cleanLangiumElement<T extends object>(obj: T): T {
   return <T>Object.entries(obj)
      .filter(([key, value]) => !key.startsWith('$') || key === '$type')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: cleanValue(value) }), {});
}

function cleanValue(value: any): any {
   return isContainedObject(value) ? cleanLangiumElement(value) : resolvedValue(value);
}

function isContainedObject(value: any): boolean {
   return value === Object(value) && !isReference(value);
}

function resolvedValue(value: any): any {
   if (isReference(value)) {
      return value.$refText;
   }
   return value;
}
