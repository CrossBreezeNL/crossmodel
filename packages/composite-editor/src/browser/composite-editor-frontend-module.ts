/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { CrossModelWidgetOptions } from '@crossbreeze/core/lib/browser';
import { OpenHandler, WidgetFactory } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { EditorPreviewManager } from '@theia/editor-preview/lib/browser/editor-preview-manager';
import { CompositeEditor } from './composite-editor';
import { CompositeEditorOpenHandler, CompositeEditorOptions } from './composite-editor-open-handler';
import { CrossModelEditorManager } from './cross-model-editor-manager';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   bind(CrossModelEditorManager).toSelf().inSingletonScope();
   rebind(EditorPreviewManager).toService(CrossModelEditorManager);

   bind(CompositeEditorOpenHandler).toSelf().inSingletonScope();
   bind(OpenHandler).toService(CompositeEditorOpenHandler);
   bind<WidgetFactory>(WidgetFactory).toDynamicValue(context => ({
      id: CompositeEditorOpenHandler.ID, // must match the id in the open handler
      createWidget: (options: CompositeEditorOptions) => {
         const container = context.container.createChild();
         container.bind(CrossModelWidgetOptions).toConstantValue(options);
         return container.resolve(CompositeEditor);
      }
   }));
});
