/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { injectable } from '@theia/core/shared/inversify';
import * as net from 'net';
import * as rpc from 'vscode-jsonrpc/node';
import { FormEditorClient, FormEditorService } from '../common/form-client-protocol';

import { CloseModel, CrossModelRoot, OpenModel, RequestModel, SaveModel, UpdateModel, OnSave } from '@crossbreeze/protocol';

// socket connection, must match the one in model-server/launch.ts
const SOCKET_OPTIONS = { port: 5999, host: 'localhost' };

/**
 * Backend service implementation that mainly forwards all requests from the Theia frontend to the model server exposed on a given socket.
 */
@injectable()
export class FormEditorServiceImpl implements FormEditorService {
    protected initialized = false;
    protected connection: rpc.MessageConnection;
    protected client?: FormEditorClient;

    async initialize(): Promise<void> {
        if (this.initialized) {
            // ensure we only initialize RPC connection once
            return;
        }
        const socket = new net.Socket();
        const reader = new rpc.SocketMessageReader(socket);
        const writer = new rpc.SocketMessageWriter(socket);
        this.connection = rpc.createMessageConnection(reader, writer);

        this.connection.onClose(() => (this.initialized = false));
        socket.on('close', () => (this.initialized = false));

        socket.connect(SOCKET_OPTIONS);
        this.connection.listen();

        this.connection.onNotification(OnSave, (uri, model) => {
            this.client?.updateModel(uri, model);
        });

        this.initialized = true;
    }

    async open(uri: string): Promise<void> {
        await this.initialize();
        await this.connection.sendRequest(OpenModel, uri);
    }

    async close(uri: string): Promise<void> {
        await this.initialize();
        await this.connection.sendRequest(CloseModel, uri);
    }

    async request(uri: string): Promise<CrossModelRoot | undefined> {
        await this.initialize();
        return this.connection.sendRequest(RequestModel, uri);
    }

    async update(uri: string, model: CrossModelRoot): Promise<void> {
        await this.initialize();
        return this.connection.sendRequest(UpdateModel, uri, model);
    }

    async save(uri: string, model: CrossModelRoot): Promise<void> {
        await this.initialize();
        return this.connection.sendRequest(SaveModel, uri, model);
    }

    dispose(): void {
        // do nothing
    }

    setClient(client: FormEditorClient): void {
        this.client = client;
    }
}
