/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, DocumentBuilder, isAstNode, LangiumDefaultSharedServices, LangiumDocuments } from 'langium';
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

   open(uri: string): void {
      this.documentManager.open(uri);
   }

   close(uri: string): void {
      this.documentManager.close(uri);
   }

   request(uri: string): AstNode | undefined;
   request<T extends AstNode>(uri: string, guard: (item: unknown) => item is T): T | undefined;
   request<T extends AstNode>(uri: string, guard?: (item: unknown) => item is T): AstNode | T | undefined {
      this.open(uri);
      const document = this.documents.getOrCreateDocument(URI.parse(uri));
      const root = document.parseResult.value;
      const check = guard ?? isAstNode;
      return check(root) ? root : undefined;
   }

   async update<T extends AstNode>(uri: string, model: T | string): Promise<T> {
      this.open(uri);
      const document = this.documents.getOrCreateDocument(URI.parse(uri));
      const root = document.parseResult.value;
      if (!isAstNode(root)) {
         throw new Error(`No AST node to update exists in '${uri}'`);
      }

      const text = typeof model === 'string' ? model : this.serializer.serialize(model);
      const version = document.textDocument.version + 1;

      TextDocument.update(document.textDocument, [{ text }], version);
      this.documentManager.update(uri, version, text);

      // do we need to await the result here?
      this.documentBuilder.update([URI.parse(uri)], []);

      return document.parseResult.value as T;
   }

   save(uri: string, model: AstNode | string): void {
      const text = typeof model === 'string' ? model : this.serializer.serialize(model);
      this.documentManager.save(uri, text);
   }
}
