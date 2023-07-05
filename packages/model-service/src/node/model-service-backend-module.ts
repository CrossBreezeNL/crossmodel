/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { MODEL_SERVICE_PATH, ModelService, ModelServiceClient } from '../common/model-service-rpc';
import { ModelServiceImpl } from './model-service';

export default new ContainerModule(bind => {
    bind(ModelService).to(ModelServiceImpl).inSingletonScope();
    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler<ModelServiceClient>(MODEL_SERVICE_PATH, client => {
                    // get the proxy client representing the frontend client and fulfill connection proxy with our service implementation
                    const server = ctx.container.get<ModelServiceImpl>(ModelService);
                    server.setClient(client);
                    client.onDidCloseConnection(() => server.dispose());
                    return server;
                })
        )
        .inSingletonScope();
});
