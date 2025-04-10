/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GLSP_PORT_COMMAND } from '@crossbreezenl/protocol';
import { GLSPContribution } from '@eclipse-glsp/theia-integration/lib/common';
import { SocketConnectionForwarder } from '@eclipse-glsp/theia-integration/lib/node';
import { Channel, CommandService, ConnectionHandler, Disposable, MessageService } from '@theia/core';
import { ForwardingChannel } from '@theia/core/lib/common/message-rpc/channel';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as net from 'net';
import { CrossModelLanguageContributionId } from '../common/crossmodel-diagram-language';

@injectable()
export class CrossModelDiagramGLSPConnectionHandler implements ConnectionHandler {
   path = GLSPContribution.servicePath + '/' + CrossModelLanguageContributionId;

   @inject(MessageService) protected messageService: MessageService;
   @inject(CommandService) protected commandService: CommandService;

   onConnection(connection: Channel): void {
      this.initializeServerConnection(connection);
   }

   protected async initializeServerConnection(channel: Channel): Promise<void> {
      const progress = await this.messageService.showProgress({
         text: 'Connecting to Graphical Server',
         options: { cancelable: false }
      });
      try {
         progress.report({ message: 'Waiting for port information...' });
         const port = await this.findPort();
         progress.report({ message: 'Waiting for connection on port ' + port + '...' });
         await this.connectToServer(channel, port);
         progress.cancel();
         this.messageService.info('Connected to Graphical Server on port ' + port, { timeout: 3000 });
      } catch (error) {
         progress.cancel();
         this.messageService.error('Could not connect to Graphical Server: ' + error);
      }
   }

   protected async findPort(timeout = 500, attempts = -1): Promise<number> {
      const pendingContent = new Deferred<number>();
      let counter = 0;
      const tryQueryingPort = (): void => {
         setTimeout(async () => {
            try {
               const port = await this.commandService.executeCommand<number>(GLSP_PORT_COMMAND);
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

   protected async connectToServer(channel: Channel, port: number): Promise<any> {
      // Create the deferred object which exposes the Promise of the connection with the ModelServer.
      const connected = new Deferred<void>();

      // Create the socket, reader, writer and rpc-connection.
      const socket = new net.Socket();

      // Configure connection promise results for the socket.
      socket.on('ready', () => connected.resolve());
      socket.on('close', () => connected.reject('Socket from Graphical Client to Graphical Server was closed.'));
      socket.on('error', error => console.error('Error occurred with the Graphical socket: %s; %s', error.name, error.message));

      this.forwardToSocketConnection(channel, socket);
      if (channel instanceof ForwardingChannel) {
         socket.on('error', error => channel.onErrorEmitter.fire(error));
      }

      // Connect to the ModelServer on the given port.
      socket.connect({ port });

      setTimeout(() => connected.reject('Timeout reached.'), 10000);
      return connected.promise;
   }

   protected forwardToSocketConnection(clientChannel: Channel, socket: net.Socket): Disposable {
      return new SocketConnectionForwarder(clientChannel, socket);
   }
}
