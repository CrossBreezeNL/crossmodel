/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, DocumentState, isAstNode } from 'langium';
import { Disposable } from 'vscode-languageserver';
import { OptionalVersionedTextDocumentIdentifier, Range, TextDocumentEdit, TextEdit } from 'vscode-languageserver-protocol';
import { URI } from 'vscode-uri';
import { CrossModelSharedServices } from '../language-server/cross-model-module';

/**
 * The model service serves as a facade to access and update semantic models from the language server as a non-LSP client.
 * It provides a simple open-request-update-save/close lifecycle for documents and their semantic model.
 */
export class ModelService {
    constructor(
        protected shared: CrossModelSharedServices,
        protected documentManager = shared.workspace.TextDocumentManager,
        protected documents = shared.workspace.LangiumDocuments,
        protected documentBuilder = shared.workspace.DocumentBuilder
    ) {}

    /**
     * Opens the document with the given URI for modification.
     *
     * @param uri document URI
     */
    async open(uri: string): Promise<void> {
        return this.documentManager.open(uri);
    }

    /**
     * Closes the document with the given URI for modification.
     *
     * @param uri document URI
     */
    async close(uri: string): Promise<void> {
        return this.documentManager.close(uri);
    }

    /**
     * Requests the semantic model stored in the document with the given URI.
     * If the document was not already open for modification, it will be opened automatically.
     *
     * @param uri document URI
     */
    request(uri: string): Promise<AstNode | undefined>;
    /**
     * Requests the semantic model stored in the document with the given URI if it matches the given guard function.
     * If the document was not already open for modification, it will be opened automatically.
     *
     * @param uri document URI
     * @param guard guard function to ensure a certain type of semantic model
     */
    request<T extends AstNode>(uri: string, guard: (item: unknown) => item is T): Promise<T | undefined>;
    async request<T extends AstNode>(uri: string, guard?: (item: unknown) => item is T): Promise<AstNode | T | undefined> {
        this.open(uri);
        const document = this.documents.getOrCreateDocument(URI.parse(uri));
        const root = document.parseResult.value;
        const check = guard ?? isAstNode;
        return check(root) ? root : undefined;
    }

    /**
     * Updates the semantic model stored in the document with the given model or textual representation of a model.
     * Any previous content will be overridden.
     * If the document was not already open for modification, it will be opened automatically.
     *
     * @param uri document URI
     * @param model semantic model or textual representation of it
     * @returns the stored semantic model
     */
    async update<T extends AstNode>(uri: string, model: T | string): Promise<T> {
        await this.open(uri);
        const document = this.documents.getOrCreateDocument(URI.parse(uri));
        const root = document.parseResult.value;
        if (!isAstNode(root)) {
            throw new Error(`No AST node to update exists in '${uri}'`);
        }
        const textDocument = document.textDocument;
        const text = typeof model === 'string' ? model : this.serialize(URI.parse(uri), model);
        if (text === textDocument.getText()) {
            return document.parseResult.value as T;
        }

        if (this.documentManager.isOpenInTextEditor(uri)) {
            // we only want to apply a text edit if the editor is already open
            // because opening and updating at the same time might cause problems as the open call resets the document to filesystem
            await this.shared.lsp.Connection?.workspace.applyEdit({
                label: 'Update Model',
                documentChanges: [
                    // we use a null version to indicate that the version is known
                    // eslint-disable-next-line no-null/no-null
                    TextDocumentEdit.create(OptionalVersionedTextDocumentIdentifier.create(textDocument.uri, null), [
                        TextEdit.replace(Range.create(0, 0, textDocument.lineCount, textDocument.getText().length), text)
                    ])
                ]
            });
        }

        await this.documentManager.update(uri, textDocument.version + 1, text);
        await this.documentBuilder.update([URI.parse(uri)], []);

        return document.parseResult.value as T;
    }

    onUpdate<T extends AstNode>(uri: string, listener: (model: T) => void): Disposable {
        return this.documentBuilder.onBuildPhase(DocumentState.Validated, (allChangedDocuments, _token) => {
            const changedDocument = allChangedDocuments.find(document => document.uri.toString() === uri);
            if (changedDocument) {
                listener(changedDocument.parseResult.value as T);
            }
        });
    }

    onSave<T extends AstNode>(uri: string, listener: (model: T) => void): Disposable {
        return this.documentManager.onSave(uri, listener);
    }

    /**
     * Overrides the document with the given URI with the given semantic model or text.
     *
     * @param uri document uri
     * @param model semantic model or text
     */
    async save(uri: string, model: AstNode | string): Promise<void> {
        // sync: implicit update of internal data structure to match file system (similar to workspace initialization)
        if (this.documents.hasDocument(URI.parse(uri))) {
            await this.update(uri, model);
        }

        const text = typeof model === 'string' ? model : this.serialize(URI.parse(uri), model);
        return this.documentManager.save(uri, text);
    }

    /**
     * Serializes the given semantic model by using the serializer service for the corresponding language.
     *
     * @param uri document uri
     * @param model semantic model
     */
    protected serialize(uri: URI, model: AstNode): string {
        const serializer = this.shared.ServiceRegistry.getServices(uri).serializer.Serializer;
        return serializer.serialize(model);
    }
}
