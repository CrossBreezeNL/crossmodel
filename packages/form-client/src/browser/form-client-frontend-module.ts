/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { NavigatableWidgetOptions, OpenHandler, WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FormEditorOpenHandler, createFormEditorId } from './form-editor-open-handler';
import { FormEditorWidget, FormEditorWidgetOptions } from './form-editor-widget';
import { CrossModelWidgetOptions } from '@crossbreeze/core/lib/browser';

export default new ContainerModule(bind => {
   bind(OpenHandler).to(FormEditorOpenHandler).inSingletonScope();
   bind<WidgetFactory>(WidgetFactory).toDynamicValue(context => ({
      id: FormEditorOpenHandler.ID, // must match the id in the open handler
      createWidget: (navigatableOptions: NavigatableWidgetOptions) => {
         // create a child container so we can bind unique form editor widget options for each widget
         const container = context.container.createChild();
         const widgetId = createFormEditorId(navigatableOptions.uri, navigatableOptions.counter);
         const options: FormEditorWidgetOptions = {
            ...navigatableOptions,
            widgetId,
            clientId: 'form-editor'
         };
         container.bind(CrossModelWidgetOptions).toConstantValue(options);
         container.bind(FormEditorWidget).toSelf();
         return container.get(FormEditorWidget);
      }
   }));
});
