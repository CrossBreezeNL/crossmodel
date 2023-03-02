/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as net from 'net';
import * as rpc from 'vscode-jsonrpc/node';
import { CrossModelLSPServices } from '../glsp-server/integration';
import { ModelServer } from './model-server';

const JSON_SERVER_PORT = 5999;
const JSON_SERVER_HOST = 'localhost';

const currentConnections: rpc.MessageConnection[] = [];

export function startJsonServer(services?: CrossModelLSPServices): Promise<void> {
   const netServer = net.createServer(socket => createClientConnection(socket, services));
   netServer.listen(JSON_SERVER_PORT, JSON_SERVER_HOST);
   netServer.on('listening', () => {
      const addressInfo = netServer.address();
      if (!addressInfo) {
         console.error('Could not resolve JSON Server address info. Shutting down.');
         close(netServer);
         return;
      } else if (typeof addressInfo === 'string') {
         console.error(`JSON Server is unexpectedly listening to pipe or domain socket "${addressInfo}". Shutting down.`);
         close(netServer);
         return;
      }
      console.log(`The JSON server is ready to accept new client requests on port: ${addressInfo.port}`);
   });
   netServer.on('error', err => {
      console.error('JSON server experienced error', err);
      close(netServer);
   });
   return new Promise((resolve, reject) => {
      netServer.on('close', () => resolve(undefined));
      netServer.on('error', error => reject(error));
   });
}

async function createClientConnection(socket: net.Socket, services?: CrossModelLSPServices): Promise<void> {
   console.info(`Starting model server connection for client: '${socket.localAddress}'`);
   const connection = createConnection(socket);
   connection.listen();
   currentConnections.push(connection);

   if (!services) {
      throw new Error('Cannot start model server without Langium services');
   }

   const modelServer = new ModelServer(connection, services.language.model.ModelService);
   connection.onDispose(() => modelServer.dispose());
   socket.on('close', () => modelServer.dispose());

   return new Promise((resolve, rejects) => {
      connection.onClose(() => resolve(undefined));
      connection.onError(error => rejects(error));
   });
}

function createConnection(socket: net.Socket): rpc.MessageConnection {
   return rpc.createMessageConnection(new rpc.SocketMessageReader(socket), new rpc.SocketMessageWriter(socket), console);
}

function close(netServer: net.Server): void {
   currentConnections.forEach(connection => connection.dispose());
   netServer.close();
}
