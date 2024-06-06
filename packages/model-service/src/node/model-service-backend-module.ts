/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { ContainerModule } from '@theia/core/shared/inversify';
import { MODEL_SERVICE_PATH, ModelServiceClient, ModelServiceServer } from '../common/model-service-rpc';
import { ModelServiceServerImpl } from './model-service-server';

const frontendScopedConnectionModule = ConnectionContainerModule.create(({ bind, bindBackendService }) => {
   bind(ModelServiceServerImpl).toSelf().inSingletonScope();
   bind(ModelServiceServer).toService(ModelServiceServerImpl);
   bindBackendService<ModelServiceServer, ModelServiceClient>(MODEL_SERVICE_PATH, ModelServiceServer, (server, client) => {
      // get the proxy client representing the frontend client and fulfill connection proxy with our service implementation
      server.setClient(client);
      client.onDidCloseConnection(() => server.dispose());
      return server;
   });
});

export default new ContainerModule(bind => {
   bind(ConnectionContainerModule).toConstantValue(frontendScopedConnectionModule);
});
