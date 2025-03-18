/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { GRID } from '@crossbreeze/protocol';
import {
   ConsoleLogger,
   GLSPHiddenBoundsUpdater,
   GLSPMousePositionTracker,
   GModelElement,
   GlspCommandPalette,
   LogLevel,
   MetadataPlacer,
   MouseDeleteTool,
   TYPES,
   ToolManager,
   ToolPalette,
   bindAsService,
   bindOrRebind,
   isRoutable,
   toElementAndRoutingPoints
} from '@eclipse-glsp/client';
import { GlspSelectionDataService } from '@eclipse-glsp/theia-integration';
import { ContainerModule, injectable, interfaces } from '@theia/core/shared/inversify';
import { VNode } from 'snabbdom';
import { CmMetadataPlacer } from './cm-metadata-placer';
import { CrossModelCommandPalette, CrossModelMousePositionTracker } from './cross-model-command-palette';
import { CrossModelMouseDeleteTool } from './cross-model-delete-tool';
import { CrossModelDiagramStartup } from './cross-model-diagram-startup';
import { CrossModelErrorExtension } from './cross-model-error-extension';
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

      bind(CrossModelMousePositionTracker).toSelf().inSingletonScope();
      bindOrRebind(context, GLSPMousePositionTracker).toService(CrossModelMousePositionTracker);

      bind(CrossModelToolManager).toSelf().inSingletonScope();
      bindOrRebind(context, TYPES.IToolManager).toService(CrossModelToolManager);

      bindAsService(bind, TYPES.IUIExtension, CrossModelErrorExtension);
      rebind(MetadataPlacer).to(CmMetadataPlacer).inSingletonScope();

      bind(CrossModelHiddenBoundsUpdater).toSelf().inSingletonScope();
      rebind(GLSPHiddenBoundsUpdater).to(CrossModelHiddenBoundsUpdater).inSingletonScope();
   });
}

@injectable()
export class CrossModelToolManager extends ToolManager {
   override enableDefaultTools(): void {
      super.enableDefaultTools();
      // since setting the _defaultToolsEnabled flag to true will short-circuit the enableDefaultTools method
      // we only set it to true if truly all default tools are enabled
      this._defaultToolsEnabled = this.activeTools.length === this.defaultTools.length;
   }
}

@injectable()
export class CrossModelHiddenBoundsUpdater extends GLSPHiddenBoundsUpdater {
   override decorate(vnode: VNode, element: GModelElement): VNode {
      super.decorate(vnode, element);
      if (isRoutable(element)) {
         const addedRoute = this.element2route.pop();
         if (addedRoute?.newRoutingPoints && addedRoute.newRoutingPoints.length >= 2) {
            this.element2route.push(addedRoute);
         } else {
            this.element2route.push(toElementAndRoutingPoints(element));
         }
      }
      return vnode;
   }
}
