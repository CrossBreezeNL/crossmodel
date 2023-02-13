/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { URI } from '@theia/core';
import { NavigatableWidgetOptions, OpenHandler, WebSocketConnectionProvider, WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FormEditorClient, FormEditorService, FORM_EDITOR_SERVICE_PATH } from '../common/form-client-protocol';
import { FormEditorClientImpl } from './form-client';
import { createFormEditorId, FormEditorOpenHandler } from './form-editor-open-handler';
import { FormEditorWidget, FormEditorWidgetOptions } from './form-editor-widget';

export default new ContainerModule(bind => {
   bind(FormEditorClient).to(FormEditorClientImpl).inSingletonScope();
   bind(FormEditorService)
      .toDynamicValue(ctx => {
         const connection = ctx.container.get(WebSocketConnectionProvider);
         const backendClient: FormEditorClient = ctx.container.get(FormEditorClient);
         return connection.createProxy<FormEditorService>(FORM_EDITOR_SERVICE_PATH, backendClient);
      })
      .inSingletonScope();

   bind(OpenHandler).to(FormEditorOpenHandler).inSingletonScope();
   bind<WidgetFactory>(WidgetFactory).toDynamicValue(context => ({
      id: FormEditorOpenHandler.ID,
      createWidget: (options: NavigatableWidgetOptions) => {
         const container = context.container.createChild();
         const uri = new URI(options.uri);
         const id = createFormEditorId(uri, options.counter);
         container.bind(FormEditorWidgetOptions).toConstantValue({ ...options, id });
         container.bind(FormEditorWidget).toSelf();
         return container.get(FormEditorWidget);
      }
   }));
});
