/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { inject, injectable } from '@theia/core/shared/inversify';
import * as net from 'net';
import * as rpc from 'vscode-jsonrpc/node';
import { FormEditorClient, FormEditorService } from '../common/form-client-protocol';

import { waitForTemporaryFileContent } from '@crossbreeze/core/lib/node';
import {
   CloseModel,
   CrossModelRoot,
   MODELSERVER_PORT_FILE,
   OnSave,
   OpenModel,
   RequestModel,
   SaveModel,
   UpdateModel
} from '@crossbreeze/protocol';
import { URI } from '@theia/core';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { WorkspaceServer } from '@theia/workspace/lib/common';

/**
 * Backend service implementation that mainly forwards all requests from the Theia frontend to the model server exposed on a given socket.
 */
@injectable()
export class FormEditorServiceImpl implements FormEditorService {
   protected initialized?: Deferred<void>;
   protected connection: rpc.MessageConnection;
   protected client?: FormEditorClient;

   @inject(WorkspaceServer) protected workspaceServer: WorkspaceServer;

   protected initialize(): Promise<void> {
      if (this.initialized) {
         return this.initialized.promise;
      }
      const initialized = new Deferred<void>();
      this.initialized = initialized;
      this.waitForPort()
         .then(port => this.connectToServer(port))
         .catch(err => initialized.reject(err))
         .then(() => initialized.resolve())
         .catch(err => initialized.reject(err));
      return initialized.promise;
   }

   protected async connectToServer(port: number): Promise<void> {
      const connected = new Deferred<void>();
      const socket = new net.Socket();
      const reader = new rpc.SocketMessageReader(socket);
      const writer = new rpc.SocketMessageWriter(socket);
      this.connection = rpc.createMessageConnection(reader, writer);

      this.connection.onClose(() => connected.reject('No connection to ModelServer.'));
      socket.on('close', () => connected.reject('No connection to ModelServer'));
      socket.on('ready', () => connected.resolve());
      socket.connect({ port });
      this.connection.listen();

      this.connection.onNotification(OnSave, (uri: string, model: CrossModelRoot) => {
         this.client?.updateModel(uri, model);
      });
      return connected.promise;
   }

   async waitForPort(): Promise<number> {
      const workspace = await this.workspaceServer.getMostRecentlyUsedWorkspace();
      if (!workspace) {
         throw new Error('No workspace set.');
      }
      const portFile = new URI(workspace).path.join(MODELSERVER_PORT_FILE).fsPath();
      const port = await waitForTemporaryFileContent(portFile);
      return Number.parseInt(port, 10);
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
      if (this.initialized) {
         this.initialized.resolve();
         this.initialized = undefined;
      }
   }

   setClient(client: FormEditorClient): void {
      this.dispose();
      this.client = client;
   }
}
