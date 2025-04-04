/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { RemoteConnectionProvider, ServiceConnectionProvider } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { MODEL_SERVICE_PATH, ModelService, ModelServiceClient, ModelServiceServer } from '../common/model-service-rpc';
import { ModelServiceImpl } from './model-service';
import { ModelServiceClientImpl } from './model-service-client';

export default new ContainerModule(bind => {
   bind(ModelServiceClientImpl).toSelf().inSingletonScope();
   bind(ModelServiceClient).toService(ModelServiceClientImpl);
   bind(ModelServiceServer)
      .toDynamicValue(ctx => {
         // establish the proxy-based connection to the Theia backend service with our client implementation
         const connection: ServiceConnectionProvider = ctx.container.get(RemoteConnectionProvider);
         const backendClient: ModelServiceClient = ctx.container.get(ModelServiceClient);
         return connection.createProxy<ModelServiceServer>(MODEL_SERVICE_PATH, backendClient);
      })
      .inSingletonScope();
   bind(ModelServiceImpl).toSelf().inSingletonScope();
   bind(ModelService).toService(ModelServiceImpl);
});
