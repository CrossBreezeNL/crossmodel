/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   CloseModel,
   CloseModelArgs,
   CrossModelRoot,
   CrossReference,
   CrossReferenceContext,
   FindReferenceableElements,
   MODELSERVER_PORT_COMMAND,
   OnSave,
   OnUpdated,
   OpenModel,
   OpenModelArgs,
   ReferenceableElement,
   RequestModel,
   RequestSystemInfo,
   ResolveReference,
   ResolvedElement,
   SaveModel,
   SaveModelArgs,
   SystemInfo,
   SystemInfoArgs,
   UpdateModel,
   UpdateModelArgs
} from '@crossbreeze/protocol';
import { CommandService, MessageService } from '@theia/core';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as net from 'net';
import * as rpc from 'vscode-jsonrpc/node';
import { ModelService, ModelServiceClient } from '../common/model-service-rpc';

/**
 * Backend service implementation that mainly forwards all requests from the Theia frontend to the model server exposed on a given socket.
 */
@injectable()
export class ModelServiceImpl implements ModelService {
   protected initialized?: Deferred<void>;
   protected connection: rpc.MessageConnection;
   protected client?: ModelServiceClient;

   @inject(MessageService) protected messageService: MessageService;
   @inject(CommandService) protected commandService: CommandService;

   setClient(client: ModelServiceClient): void {
      if (this.client) {
         this.dispose();
      }
      this.client = client;
      this.initializeServerConnection();
   }

   protected async initializeServerConnection(): Promise<void> {
      if (this.initialized) {
         return this.initialized.promise;
      }
      this.initialized = new Deferred<void>();
      const progress = await this.messageService.showProgress({
         text: 'Connecting to Model Server',
         options: { cancelable: false }
      });
      try {
         progress.report({ message: 'Waiting for port information...' });
         const port = await this.findPort();
         progress.report({ message: 'Waiting for connection on port ' + port + '...' });
         await this.connectToServer(port);
         progress.cancel();
         this.messageService.info('Connected to Model Server on port ' + port, { timeout: 3000 });
         this.initialized.resolve();
      } catch (error) {
         progress.cancel();
         this.messageService.error('Could not connect to Model Server: ' + error);
         this.initialized.reject(error);
      }
   }

   protected async connectToServer(port: number): Promise<any> {
      // Create the deferred object which exposes the Promise of the connection with the ModelServer.
      const connected = new Deferred<void>();

      // Create the socket, reader, writer and rpc-connection.
      const socket = new net.Socket();
      const reader = new rpc.SocketMessageReader(socket);
      const writer = new rpc.SocketMessageWriter(socket);
      this.connection = rpc.createMessageConnection(reader, writer);

      // Configure connection promise results for the rpc connection.
      this.connection.onClose(() => connected.reject('Connection with the ModelServer was closed.'));
      this.connection.onError(error => connected.reject('Error occurred with the connection to the ModelServer: ' + JSON.stringify(error)));

      // Configure connection promise results for the socket.
      socket.on('ready', () => connected.resolve());
      socket.on('close', () => connected.reject('Socket from ModelService to ModelServer was closed.'));
      socket.on('error', error => console.error('Error occurred with the ModelServer socket: %s; %s', error.name, error.message));

      // Connect to the ModelServer on the given port.
      socket.connect({ port });
      this.connection.listen();

      this.setUpListeners();
      setTimeout(() => connected.reject('Timeout reached.'), 10000);
      return connected.promise;
   }

   protected async findPort(timeout = 500, attempts = -1): Promise<number> {
      const pendingContent = new Deferred<number>();
      let counter = 0;
      const tryQueryingPort = (): void => {
         setTimeout(async () => {
            try {
               const port = await this.commandService.executeCommand<number>(MODELSERVER_PORT_COMMAND);
               if (port) {
                  pendingContent.resolve(port);
               }
            } catch (error) {
               counter++;
               if (attempts >= 0 && counter > attempts) {
                  pendingContent.reject(error);
               } else {
                  tryQueryingPort();
               }
            }
         }, timeout);
      };
      tryQueryingPort();
      return pendingContent.promise;
   }

   async open(args: OpenModelArgs): Promise<CrossModelRoot | undefined> {
      await this.initializeServerConnection();
      return this.connection.sendRequest(OpenModel, args);
   }

   async close(args: CloseModelArgs): Promise<void> {
      await this.initializeServerConnection();
      await this.connection.sendRequest(CloseModel, args);
   }

   async request(uri: string): Promise<CrossModelRoot | undefined> {
      await this.initializeServerConnection();
      return this.connection.sendRequest(RequestModel, uri);
   }

   async update(args: UpdateModelArgs<CrossModelRoot>): Promise<CrossModelRoot> {
      await this.initializeServerConnection();
      return this.connection.sendRequest(UpdateModel, args);
   }

   async save(args: SaveModelArgs<CrossModelRoot>): Promise<void> {
      await this.initializeServerConnection();
      return this.connection.sendRequest(SaveModel, args);
   }

   dispose(): void {
      if (this.initialized) {
         this.initialized.resolve();
         this.initialized = undefined;
      }
   }

   async findReferenceableElements(args: CrossReferenceContext): Promise<ReferenceableElement[]> {
      await this.initializeServerConnection();
      return this.connection.sendRequest(FindReferenceableElements, args);
   }

   async resolveReference(reference: CrossReference): Promise<ResolvedElement | undefined> {
      await this.initializeServerConnection();
      return this.connection.sendRequest(ResolveReference, reference);
   }

   async getSystemInfo(args: SystemInfoArgs): Promise<SystemInfo | undefined> {
      await this.initializeServerConnection();
      return this.connection.sendRequest(RequestSystemInfo, args);
   }

   protected setUpListeners(): void {
      this.connection.onNotification(OnSave, event => {
         this.client?.updateModel({ ...event, reason: 'saved' });
      });
      this.connection.onNotification(OnUpdated, event => {
         this.client?.updateModel(event);
      });
   }
}
