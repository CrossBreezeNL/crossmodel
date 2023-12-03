/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CloseModelArgs, ModelSavedEvent, ModelUpdatedEvent, OpenModelArgs } from '@crossbreeze/protocol';
import * as fs from 'fs';
import {
   AstNode,
   DocumentBuilder,
   DocumentState,
   FileSystemProvider,
   LangiumDefaultSharedServices,
   LangiumDocument,
   LangiumDocuments
} from 'langium';
import { Disposable } from 'vscode-languageserver';
import { TextDocumentIdentifier, TextDocumentItem, VersionedTextDocumentIdentifier } from 'vscode-languageserver-protocol';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { CrossModelLanguageMetaData } from '../language-server/generated/module.js';
import { AddedSharedModelServices } from './model-module.js';
import { OpenableTextDocuments } from './openable-text-documents.js';

export interface UpdateInfo {
   changed: URI[];
   deleted: URI[];
}

/**
 * A manager class that supports handling documents with a simple open-update-save/close lifecycle.
 *
 * The manager wraps the services exposed by Langium and acts as a small language client on behalf of the caller.
 */
export class OpenTextDocumentManager {
   protected textDocuments: OpenableTextDocuments<TextDocument>;
   protected fileSystemProvider: FileSystemProvider;
   protected langiumDocs: LangiumDocuments;
   protected documentBuilder: DocumentBuilder;

   protected lastUpdate?: UpdateInfo;

   constructor(services: AddedSharedModelServices & LangiumDefaultSharedServices) {
      this.textDocuments = services.workspace.TextDocuments;
      this.fileSystemProvider = services.workspace.FileSystemProvider;
      this.langiumDocs = services.workspace.LangiumDocuments;
      this.documentBuilder = services.workspace.DocumentBuilder;

      this.textDocuments.onDidOpen(event =>
         this.open({ clientId: event.clientId, uri: event.document.uri, languageId: event.document.languageId })
      );
      this.textDocuments.onDidClose(event => this.close({ clientId: event.clientId, uri: event.document.uri }));
      this.documentBuilder.onUpdate((changed, deleted) => {
         this.lastUpdate = { changed, deleted };
      });
   }

   /**
    * Subscribe to the save event of the textdocument.
    *
    * @param uri Uri of the document to listen to. The callback only gets called when this URI and the URI of the saved document
    * are equal.
    * @param listener Callback to be called
    * @returns Disposable object
    */
   onSave<T extends AstNode>(uri: string, listener: (model: ModelSavedEvent<T>) => void): Disposable {
      return this.textDocuments.onDidSave(event => {
         const documentURI = URI.parse(event.document.uri);

         // Check if the uri of the saved document and the uri of the listener are equal.
         if (event.document.uri === uri && documentURI !== undefined && this.langiumDocs.hasDocument(documentURI)) {
            const document = this.langiumDocs.getOrCreateDocument(documentURI);
            const root = document.parseResult.value;
            return listener({ model: root as T, uri: event.document.uri, sourceClientId: event.clientId });
         }

         return undefined;
      });
   }

   onUpdate<T extends AstNode>(uri: string, listener: (model: ModelUpdatedEvent<T>) => void): Disposable {
      return this.documentBuilder.onBuildPhase(DocumentState.Validated, (allChangedDocuments, _token) => {
         const changedDocument = allChangedDocuments.find(document => document.uri.toString() === uri);
         if (changedDocument) {
            const sourceClientId = this.getSourceClientId(changedDocument, allChangedDocuments);
            const event: ModelUpdatedEvent<T> = {
               model: changedDocument.parseResult.value as T,
               sourceClientId,
               uri: changedDocument.textDocument.uri,
               reason: this.lastUpdate?.changed.includes(changedDocument.uri)
                  ? 'changed'
                  : this.lastUpdate?.deleted.includes(changedDocument.uri)
                    ? 'deleted'
                    : 'updated'
            };
            listener(event);
         }
      });
   }

   getSourceClientId(preferred: LangiumDocument<AstNode>, rest: LangiumDocument<AstNode>[]): string {
      const clientId = this.textDocuments.getChangeSource(preferred.textDocument.uri, preferred.textDocument.version);
      if (clientId) {
         return clientId;
      }
      return (
         rest
            .map(document => this.textDocuments.getChangeSource(document.textDocument.uri, document.textDocument.version))
            .find(source => source !== undefined) || 'unknown'
      );
   }

   async open(args: OpenModelArgs): Promise<void> {
      // only create a dummy document if it is already open as we use the synced state anyway
      const textDocument = this.isOpen(args.uri)
         ? this.createDummyDocument(args.uri)
         : await this.createDocumentFromFileSystem(args.uri, args.languageId);
      this.textDocuments.notifyDidOpenTextDocument({ textDocument }, args.clientId);
   }

   async close(args: CloseModelArgs): Promise<void> {
      this.textDocuments.notifyDidCloseTextDocument({ textDocument: TextDocumentIdentifier.create(args.uri) }, args.clientId);
   }

   async update(uri: string, version: number, text: string, clientId: string): Promise<void> {
      if (!this.isOpen(uri)) {
         throw new Error(`Document ${uri} hasn't been opened for updating yet`);
      }
      this.textDocuments.notifyDidChangeTextDocument(
         {
            textDocument: VersionedTextDocumentIdentifier.create(uri, version),
            contentChanges: [{ text }]
         },
         clientId
      );
   }

   async save(uri: string, text: string, clientId: string): Promise<void> {
      const vscUri = URI.parse(uri);
      fs.writeFileSync(vscUri.fsPath, text);
      this.textDocuments.notifyDidSaveTextDocument({ textDocument: TextDocumentIdentifier.create(uri), text }, clientId);
   }

   isOpen(uri: string): boolean {
      return !!this.textDocuments.get(this.normalizedUri(uri)) || !!this.textDocuments.get(uri);
   }

   isOpenInLanguageClient(uri: string): boolean {
      return this.textDocuments.isOpenInLanguageClient(this.normalizedUri(uri));
   }

   protected createDummyDocument(uri: string): TextDocumentItem {
      return TextDocumentItem.create(this.normalizedUri(uri), CrossModelLanguageMetaData.languageId, 0, '');
   }

   protected async createDocumentFromFileSystem(
      uri: string,
      languageId: string = CrossModelLanguageMetaData.languageId
   ): Promise<TextDocumentItem> {
      const vscUri = URI.parse(uri);
      const content = this.fileSystemProvider.readFileSync(vscUri);
      return TextDocumentItem.create(vscUri.toString(), languageId, 0, content.toString());
   }

   protected normalizedUri(uri: string): string {
      return URI.parse(uri).toString();
   }
}
