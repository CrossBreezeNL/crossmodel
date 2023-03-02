/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { injectable } from '@theia/core/shared/inversify';
import * as net from 'net';
import * as rpc from 'vscode-jsonrpc/node';
import { CrossModelRoot, FormEditorClient, FormEditorService } from '../common/form-client-protocol';

const SOCKET_OPTIONS = { port: 5999, host: 'localhost' };
const OpenModel = new rpc.RequestType1<string, void, void>('server/open');
const CloseModel = new rpc.RequestType1<string, void, void>('server/close');
const RequestModel = new rpc.RequestType1<string, CrossModelRoot | undefined, void>('server/request');
const UpdateModel = new rpc.RequestType2<string, CrossModelRoot, void, void>('server/update');
const SaveModel = new rpc.RequestType2<string, CrossModelRoot, void, void>('server/save');

@injectable()
export class FormEditorServiceImpl implements FormEditorService {
   protected initialized = false;
   protected connection: rpc.MessageConnection;
   protected client?: FormEditorClient;

   async initialize(): Promise<void> {
      if (this.initialized) {
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
