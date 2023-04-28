/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { URI } from '@theia/core';
import { NavigatableWidgetOptions, OpenHandler, WebSocketConnectionProvider, WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FORM_EDITOR_SERVICE_PATH, FormEditorClient, FormEditorService } from '../common/form-client-protocol';
import { FormEditorClientImpl } from './form-client';
import { FormEditorOpenHandler, createFormEditorId } from './form-editor-open-handler';
import { FormEditorWidget, FormEditorWidgetOptions } from './form-editor-widget';

export default new ContainerModule(bind => {
   bind(FormEditorClientImpl).toSelf().inSingletonScope();
   bind(FormEditorClient).toService(FormEditorClientImpl);
   bind(FormEditorService)
      .toDynamicValue(ctx => {
         // establish the proxy-based connection to the Theia backend service with out client implementation
         const connection = ctx.container.get(WebSocketConnectionProvider);
         const backendClient: FormEditorClient = ctx.container.get(FormEditorClient);
         return connection.createProxy<FormEditorService>(FORM_EDITOR_SERVICE_PATH, backendClient);
      })
      .inSingletonScope();

   bind(OpenHandler).to(FormEditorOpenHandler).inSingletonScope();
   bind<WidgetFactory>(WidgetFactory).toDynamicValue(context => ({
      id: FormEditorOpenHandler.ID, // must match the id in the open handler
      createWidget: (options: NavigatableWidgetOptions) => {
         // create a child container so we can bind unique form editor widget options for each widget
         const container = context.container.createChild();
         const uri = new URI(options.uri);
         const id = createFormEditorId(uri, options.counter);
         container.bind(FormEditorWidgetOptions).toConstantValue({ ...options, id });
         container.bind(FormEditorWidget).toSelf();
         return container.get(FormEditorWidget);
      }
   }));
});
