/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, isAstNode } from 'langium';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { CrossModelSharedServices } from '../language-server/cross-model-module';

export class ModelService {
   constructor(
      protected shared: CrossModelSharedServices,
      protected documentManager = shared.workspace.TextDocumentManager,
      protected documents = shared.workspace.LangiumDocuments,
      protected documentBuilder = shared.workspace.DocumentBuilder
   ) {}

   async open(uri: string): Promise<void> {
      return this.documentManager.open(uri);
   }

   async close(uri: string): Promise<void> {
      return this.documentManager.close(uri);
   }

   request(uri: string): Promise<AstNode | undefined>;
   request<T extends AstNode>(uri: string, guard: (item: unknown) => item is T): Promise<T | undefined>;
   async request<T extends AstNode>(uri: string, guard?: (item: unknown) => item is T): Promise<AstNode | T | undefined> {
      this.open(uri);
      const document = this.documents.getOrCreateDocument(URI.parse(uri));
      const root = document.parseResult.value;
      const check = guard ?? isAstNode;
      return check(root) ? root : undefined;
   }

   async update<T extends AstNode>(uri: string, model: T | string): Promise<T> {
      await this.open(uri);
      const document = this.documents.getOrCreateDocument(URI.parse(uri));
      const root = document.parseResult.value;
      if (!isAstNode(root)) {
         throw new Error(`No AST node to update exists in '${uri}'`);
      }

      const text = typeof model === 'string' ? model : this.serialize(URI.parse(uri), model);
      const version = document.textDocument.version + 1;

      TextDocument.update(document.textDocument, [{ text }], version);
      await this.documentManager.update(uri, version, text);
      await this.documentBuilder.update([URI.parse(uri)], []);

      return document.parseResult.value as T;
   }

   async save(uri: string, model: AstNode | string): Promise<void> {
      const text = typeof model === 'string' ? model : this.serialize(URI.parse(uri), model);
      return this.documentManager.save(uri, text);
   }

   protected serialize(uri: URI, model: AstNode): string {
      const serializer = this.shared.ServiceRegistry.getServices(uri).serializer.Serializer;
      return serializer.serialize(model);
   }
}
