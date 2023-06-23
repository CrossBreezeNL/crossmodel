/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { URI } from '@theia/core';
import { NavigatableWidgetOptions, OpenHandler, WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FormEditorOpenHandler, createFormEditorId } from './form-editor-open-handler';
import { FormEditorWidget, FormEditorWidgetOptions } from './form-editor-widget';

export default new ContainerModule(bind => {
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
