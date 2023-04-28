/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FORM_EDITOR_SERVICE_PATH, FormEditorClient, FormEditorService } from '../common/form-client-protocol';
import { FormEditorServiceImpl } from './form-server';

export default new ContainerModule(bind => {
   bind(FormEditorService).to(FormEditorServiceImpl).inSingletonScope();
   bind(ConnectionHandler)
      .toDynamicValue(
         ctx =>
            new JsonRpcConnectionHandler<FormEditorClient>(FORM_EDITOR_SERVICE_PATH, client => {
               // get the proxy client representing the frontend client and fulfill connection proxy with our service implementation
               const server = ctx.container.get<FormEditorServiceImpl>(FormEditorService);
               server.setClient(client);
               client.onDidCloseConnection(() => server.dispose());
               return server;
            })
      )
      .inSingletonScope();
});
