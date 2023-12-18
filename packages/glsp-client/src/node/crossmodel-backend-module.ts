/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ConnectionHandler } from '@theia/core';
import { ConnectionContainerModule } from '@theia/core/lib/node/messaging/connection-container-module';
import { ContainerModule } from '@theia/core/shared/inversify/index';
import { CrossModelDiagramGLSPConnectionHandler } from './crossmodel-diagram-connection-handler';

const frontendScopedConnectionModule = ConnectionContainerModule.create(({ bind }) => {
   bind(CrossModelDiagramGLSPConnectionHandler).toSelf().inSingletonScope();
   bind(ConnectionHandler)
      .toDynamicValue(context => context.container.get(CrossModelDiagramGLSPConnectionHandler))
      .inSingletonScope();
});

export default new ContainerModule(bind => {
   bind(ConnectionContainerModule).toConstantValue(frontendScopedConnectionModule);
});
