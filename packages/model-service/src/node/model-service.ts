/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { injectable } from '@theia/core/shared/inversify';
import * as net from 'net';
import * as rpc from 'vscode-jsonrpc/node';
import { CrossModelRoot, DiagramNodeEntity, ModelService, ModelServiceClient } from '../common/model-service-protocol';

// socket connection, must match the one in model-server/launch.ts
const SOCKET_OPTIONS = { port: 5999, host: 'localhost' };

// RPC-protocol used to communicate with the RPC model server
// In the long term it would be great if this definition could be shared between the server and the client instead of duplicated
const OpenModel = new rpc.RequestType1<string, void, void>('server/open');
const CloseModel = new rpc.RequestType1<string, void, void>('server/close');
const RequestModel = new rpc.RequestType1<string, CrossModelRoot | undefined, void>('server/request');
const RequestModelDiagramNode = new rpc.RequestType2<string, string, DiagramNodeEntity | undefined, void>('server/requestModelDiagramNode');
const UpdateModel = new rpc.RequestType2<string, CrossModelRoot, void, void>('server/update');
const SaveModel = new rpc.RequestType2<string, CrossModelRoot, void, void>('server/save');
const OnSave = new rpc.NotificationType2<string, CrossModelRoot>('server/onSave');

/**
 * Backend service implementation that mainly forwards all requests from the Theia frontend to the model server exposed on a given socket.
 */
@injectable()
export class ModelServiceImpl implements ModelService {
    protected initialized = false;
    protected connection: rpc.MessageConnection;
    protected client?: ModelServiceClient;

    async initialize(): Promise<void> {
        // ensure we only initialize RPC connection once
        if (this.initialized) {
            return;
        }

        // Set up the connection to the model server
        const socket = new net.Socket();
        const reader = new rpc.SocketMessageReader(socket);
        const writer = new rpc.SocketMessageWriter(socket);
        this.connection = rpc.createMessageConnection(reader, writer);

        // on close
        this.connection.onClose(() => (this.initialized = false));
        socket.on('close', () => (this.initialized = false));

        // Make connection.
        socket.connect(SOCKET_OPTIONS);
        this.connection.listen();

        // Set up listeners
        this.setUpListeners();

        // When everything is successfull, the model service is initialized
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

    async requestDiagramNodeEntityModel(uri: string, id: string): Promise<DiagramNodeEntity | undefined> {
        await this.initialize();
        return this.connection.sendRequest(RequestModelDiagramNode, uri, id);
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

    setClient(client: ModelServiceClient): void {
        this.client = client;
    }

    setUpListeners(): void {
        this.connection.onNotification(OnSave, (uri, model) => {
            this.client?.updateModel(uri, model);
        });
    }
}
