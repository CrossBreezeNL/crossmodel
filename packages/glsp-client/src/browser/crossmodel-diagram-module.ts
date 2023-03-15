/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   configureDefaultModelElements,
   ConsoleLogger,
   createDiagramContainer,
   LogLevel,
   overrideViewerOptions,
   TYPES
} from '@eclipse-glsp/client';
import { Container, ContainerModule } from '@theia/core/shared/inversify';

const crossModelDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
   rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
   rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
   const context = { bind, unbind, isBound, rebind };
   configureDefaultModelElements(context);
});

export default function createCrossModelDiagramContainer(widgetId: string): Container {
   const container = createDiagramContainer(crossModelDiagramModule);

   overrideViewerOptions(container, {
      baseDiv: widgetId,
      hiddenDiv: widgetId + '_hidden'
   });

   return container;
}
