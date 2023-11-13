/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CloseModelArgs, ModelSavedEvent, ModelUpdatedEvent, OpenModelArgs, SaveModelArgs, UpdateModelArgs } from '@crossbreeze/protocol';
import { AstNode, Deferred, DocumentState, isAstNode } from 'langium';
import { Disposable, OptionalVersionedTextDocumentIdentifier, Range, TextDocumentEdit, TextEdit, uinteger } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { CrossModelSharedServices } from '../language-server/cross-model-module';
import { LANGUAGE_CLIENT_ID } from './openable-text-documents';

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
    ) {
        // sync updates with language client
        this.documentBuilder.onBuildPhase(DocumentState.Validated, (allChangedDocuments, _token) => {
            for (const changedDocument of allChangedDocuments) {
                const sourceClientId = this.documentManager.getSourceClientId(changedDocument, allChangedDocuments);
                if (sourceClientId === LANGUAGE_CLIENT_ID) {
                    continue;
                }
                const textDocument = changedDocument.textDocument;
                if (this.documentManager.isOpenInLanguageClient(textDocument.uri)) {
                    // we only want to apply a text edit if the editor is already open
                    // because opening and updating at the same time might cause problems as the open call resets the document to filesystem
                    this.shared.lsp.Connection?.workspace.applyEdit({
                        label: 'Update Model',
                        documentChanges: [
                            // we use a null version to indicate that the version is known
                            // eslint-disable-next-line no-null/no-null
                            TextDocumentEdit.create(OptionalVersionedTextDocumentIdentifier.create(textDocument.uri, null), [
                                TextEdit.replace(Range.create(0, 0, uinteger.MAX_VALUE, uinteger.MAX_VALUE), textDocument.getText())
                            ])
                        ]
                    });
                }
            }
        });
    }

    /**
     * Opens the document with the given URI for modification.
     *
     * @param uri document URI
     */
    async open(args: OpenModelArgs): Promise<void> {
        return this.documentManager.open(args);
    }

    isOpen(uri: string): boolean {
        return this.documentManager.isOpen(uri);
    }

    /**
     * Closes the document with the given URI for modification.
     *
     * @param uri document URI
     */
    async close(args: CloseModelArgs): Promise<void> {
        return this.documentManager.close(args);
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
    async update<T extends AstNode>(args: UpdateModelArgs<T>): Promise<T> {
        await this.open(args);
        const documentUri = URI.parse(args.uri);
        const document = this.documents.getOrCreateDocument(documentUri);
        const root = document.parseResult.value;
        if (!isAstNode(root)) {
            throw new Error(`No AST node to update exists in '${args.uri}'`);
        }
        const textDocument = document.textDocument;
        const text = typeof args.model === 'string' ? args.model : this.serialize(documentUri, args.model);
        if (text === textDocument.getText()) {
            return document.parseResult.value as T;
        }
        const newVersion = textDocument.version + 1;
        const pendingUpdate = new Deferred<T>();
        const listener = this.documentBuilder.onBuildPhase(DocumentState.Validated, (allChangedDocuments, _token) => {
            const updatedDocument = allChangedDocuments
                .find(doc => doc.uri.toString() === documentUri.toString() && doc.textDocument.version === newVersion);
            if (updatedDocument) {
                pendingUpdate.resolve(updatedDocument.parseResult.value as T);
                listener.dispose();
            }
        });
        const timeout = new Promise<T>((_, reject) => setTimeout(() => { listener.dispose(); reject('Update timed out.'); }, 5000));
        this.documentManager.update(args.uri, newVersion, text, args.clientId);
        return Promise.race([pendingUpdate.promise, timeout]);
    }

    onUpdate<T extends AstNode>(uri: string, listener: (model: ModelUpdatedEvent<T>) => void): Disposable {
        return this.documentManager.onUpdate(uri, listener);
    }

    onSave<T extends AstNode>(uri: string, listener: (model: ModelSavedEvent<T>) => void): Disposable {
        return this.documentManager.onSave(uri, listener);
    }

    /**
     * Overrides the document with the given URI with the given semantic model or text.
     *
     * @param uri document uri
     * @param model semantic model or text
     */
    async save<T extends AstNode>(args: SaveModelArgs<T>): Promise<void> {
        // sync: implicit update of internal data structure to match file system (similar to workspace initialization)
        if (this.documents.hasDocument(URI.parse(args.uri))) {
            await this.update(args);
        }

        const text = typeof args.model === 'string' ? args.model : this.serialize(URI.parse(args.uri), args.model);
        return this.documentManager.save(args.uri, text, args.clientId);
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
