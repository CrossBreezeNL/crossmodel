/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { MODEL_SERVICE_PATH, ModelServiceClient, ModelService } from '../common/model-service-protocol';
import { ModelServiceClientImpl } from './model-service-client';

export default new ContainerModule(bind => {
    bind(ModelServiceClientImpl).toSelf().inSingletonScope();
    bind(ModelServiceClient).toService(ModelServiceClientImpl);
    bind(ModelService)
        .toDynamicValue(ctx => {
            // establish the proxy-based connection to the Theia backend service with out client implementation
            const connection = ctx.container.get(WebSocketConnectionProvider);
            const backendClient: ModelServiceClient = ctx.container.get(ModelServiceClient);
            return connection.createProxy<ModelService>(MODEL_SERVICE_PATH, backendClient);
        })
        .inSingletonScope();
});
