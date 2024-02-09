/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ConsoleLogger, LogLevel, SetViewportAction, TYPES, bindAsService, configureActionHandler } from '@eclipse-glsp/client';
import { TheiaGLSPSelectionForwarder } from '@eclipse-glsp/theia-integration';
import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { GridAlignmentHandler } from './crossmodel-grid-handler';
import { CrossModelGridSnapper } from './crossmodel-grid-snapper';
import { CrossModelGLSPSelectionDataService } from './crossmodel-selection-data-service';
import { CrossModelSelectionDataService, CrossModelTheiaGLSPSelectionForwarder } from './crossmodel-selection-forwarder';

export function createCrossModelDiagramModule(registry: interfaces.ContainerModuleCallBack): ContainerModule {
   return new ContainerModule((bind, unbind, isBound, rebind, unbindAsync, onActivation, onDeactivation) => {
      rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
      rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
      bindAsService(bind, CrossModelSelectionDataService, CrossModelGLSPSelectionDataService);
      bind(CrossModelTheiaGLSPSelectionForwarder).toSelf().inSingletonScope();
      rebind(TheiaGLSPSelectionForwarder).toService(CrossModelTheiaGLSPSelectionForwarder);
      bind(TYPES.ISnapper).to(CrossModelGridSnapper);
      configureActionHandler({ bind, isBound }, SetViewportAction.KIND, GridAlignmentHandler);
      registry(bind, unbind, isBound, rebind, unbindAsync, onActivation, onDeactivation);
   });
}
