/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { GRID } from '@crossbreeze/protocol';
import { ConsoleLogger, GlspCommandPalette, LogLevel, MouseDeleteTool, TYPES, ToolPalette, bindAsService } from '@eclipse-glsp/client';
import { GlspSelectionDataService, TheiaGLSPSelectionForwarder } from '@eclipse-glsp/theia-integration';
import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { CrossModelCommandPalette } from './cross-model-command-palette';
import { CrossModelMouseDeleteTool } from './cross-model-delete-tool';
import { CrossModelDiagramStartup } from './cross-model-diagram-startup';
import { CrossModelToolPalette } from './cross-model-tool-palette';
import { CrossModelGLSPSelectionDataService } from './crossmodel-selection-data-service';

export function createCrossModelDiagramModule(registry: interfaces.ContainerModuleCallBack): ContainerModule {
   return new ContainerModule((bind, unbind, isBound, rebind, unbindAsync, onActivation, onDeactivation) => {
      const context = { bind, unbind, isBound, rebind };
      rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
      rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
      rebind(TYPES.Grid).toConstantValue(GRID);
      bind(CrossModelToolPalette).toSelf().inSingletonScope();
      bind(CrossModelMouseDeleteTool).toSelf().inSingletonScope();
      rebind(MouseDeleteTool).toService(CrossModelMouseDeleteTool);
      rebind(ToolPalette).toService(CrossModelToolPalette);
      bindAsService(context, GlspSelectionDataService, CrossModelGLSPSelectionDataService);
      bindAsService(context, TYPES.IDiagramStartup, CrossModelDiagramStartup);
      registry(bind, unbind, isBound, rebind, unbindAsync, onActivation, onDeactivation);
      bind(CrossModelCommandPalette).toSelf().inSingletonScope();
      rebind(GlspCommandPalette).toService(CrossModelCommandPalette);

      // there is a bug in the GLSP client release that will be fixed with 2.2.1 but for now we need to workaround
      bind('selectionListener').toService(TheiaGLSPSelectionForwarder);
   });
}
