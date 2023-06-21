/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { ContainerModule } from 'inversify';
import { AttributePropertyServer, AttributePropertyServerImp } from './property-server';
import { AttributeFrontEndClient } from '../common/pv-frontend-client';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
    bind(AttributePropertyServer).to(AttributePropertyServerImp).inSingletonScope();

    bind(ConnectionHandler)
        .toDynamicValue(
            ctx =>
                new JsonRpcConnectionHandler<AttributeFrontEndClient>('/services/property-view', client => {
                    const propertyServer = ctx.container.get<AttributePropertyServer>(AttributePropertyServer);
                    propertyServer.setClient(client);
                    return propertyServer;
                })
        )
        .inSingletonScope();
});
