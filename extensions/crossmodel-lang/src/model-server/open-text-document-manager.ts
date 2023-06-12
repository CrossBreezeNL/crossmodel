/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as fs from 'fs';
import { AstNode, FileSystemProvider, LangiumDefaultSharedServices, LangiumDocuments } from 'langium';
import { TextDocumentIdentifier, TextDocumentItem, VersionedTextDocumentIdentifier } from 'vscode-languageserver-protocol';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { URI } from 'vscode-uri';
import { AddedSharedModelServices } from './model-module';
import { OpenableTextDocuments } from './openable-text-documents';
import { Disposable } from 'vscode-languageserver';

/**
 * A manager class that suppors handling documents with a simple open-update-save/close lifecycle.
 *
 * The manager wraps the services exposed by Langium and acts as a small language client on behalf of the caller.
 */
export class OpenTextDocumentManager {
    protected textDocuments: OpenableTextDocuments<TextDocument>;
    protected fileSystemProvider: FileSystemProvider;
    protected langiumDocs: LangiumDocuments;

    /** Normalized URIs of open documents */
    protected openDocuments: string[] = [];

    constructor(services: AddedSharedModelServices & LangiumDefaultSharedServices) {
        this.textDocuments = services.workspace.TextDocuments;
        this.fileSystemProvider = services.workspace.FileSystemProvider;
        this.langiumDocs = services.workspace.LangiumDocuments;

        this.textDocuments.onDidOpen(event => this.open(event.document.uri, event.document.languageId));
        this.textDocuments.onDidClose(event => this.close(event.document.uri));
    }

    /**
     * Subscribe to the onsave of the textdocuments.
     *
     * @param uri Uri of the document to listen to. The callback only gets called when this URI and the URI of the saved document
     * are equal.
     * @param listener Callback to be called
     * @returns Disposable object
     */
    onSave<T extends AstNode>(uri: string, listener: (model: T) => void): Disposable {
        return this.textDocuments.onDidSave(e => {
            const documentURI = URI.parse(e.document.uri);

            // Check if the uri of the saved document and the uri of the listener are equal.
            if (e.document.uri === uri && documentURI !== undefined && this.langiumDocs.hasDocument(documentURI)) {
                const document = this.langiumDocs.getOrCreateDocument(documentURI);
                const root = document.parseResult.value;
                return listener(root as T);
            }

            return undefined;
        });
    }

    async open(uri: string, languageId?: string): Promise<void> {
        if (this.isOpen(uri)) {
            return;
        }
        this.openDocuments.push(this.normalizedUri(uri));
        const textDocument = await this.readFromFilesystem(uri, languageId);
        this.textDocuments.notifyDidOpenTextDocument({ textDocument });
    }

    async close(uri: string): Promise<void> {
        if (!this.isOpen(uri)) {
            return;
        }
        this.removeFromOpenedDocuments(uri);
        this.textDocuments.notifyDidCloseTextDocument({ textDocument: TextDocumentIdentifier.create(uri) });
    }

    async update(uri: string, version: number, text: string): Promise<void> {
        if (!this.isOpen(uri)) {
            throw new Error(`Document ${uri} hasn't been opened for updating yet`);
        }
        this.textDocuments.notifyDidChangeTextDocument({
            textDocument: VersionedTextDocumentIdentifier.create(uri, version),
            contentChanges: [{ text }]
        });
    }

    async save(uri: string, text: string): Promise<void> {
        const vscUri = URI.parse(uri);
        fs.writeFileSync(vscUri.fsPath, text);
        this.textDocuments.notifyDidSaveTextDocument({ textDocument: TextDocumentIdentifier.create(uri) });
    }

    protected isOpen(uri: string): boolean {
        return this.openDocuments.includes(this.normalizedUri(uri));
    }

    protected removeFromOpenedDocuments(uri: string): void {
        this.openDocuments.splice(this.openDocuments.indexOf(this.normalizedUri(uri)));
    }

    protected async readFromFilesystem(uri: string, languageId = 'cross-model'): Promise<TextDocumentItem> {
        const vscUri = URI.parse(uri);
        const content = this.fileSystemProvider.readFileSync(vscUri);
        return TextDocumentItem.create(vscUri.toString(), languageId, 1, content.toString());
    }

    protected normalizedUri(uri: string): string {
        return URI.parse(uri).toString();
    }
}
