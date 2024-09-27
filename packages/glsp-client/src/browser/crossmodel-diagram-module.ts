/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { GRID } from '@crossbreeze/protocol';
import {
   ConsoleLogger,
   GLSPMousePositionTracker,
   GlspCommandPalette,
   LogLevel,
   MouseDeleteTool,
   StatusOverlay,
   TYPES,
   ToolManager,
   ToolPalette,
   bindAsService,
   bindOrRebind
} from '@eclipse-glsp/client';
import { GlspSelectionDataService } from '@eclipse-glsp/theia-integration';
import { ContainerModule, injectable, interfaces } from '@theia/core/shared/inversify';
import { CrossModelCommandPalette, CrossModelMousePositionTracker } from './cross-model-command-palette';
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

      bind(CrossModelMousePositionTracker).toSelf().inSingletonScope();
      bindOrRebind(context, GLSPMousePositionTracker).toService(CrossModelMousePositionTracker);

      bind(CrossModelStatusOverlay).toSelf().inSingletonScope();
      bindOrRebind(context, StatusOverlay).toService(CrossModelStatusOverlay);

      bind(CrossModelToolManager).toSelf().inSingletonScope();
      bindOrRebind(context, TYPES.IToolManager).toService(CrossModelToolManager);
   });
}

@injectable()
export class CrossModelStatusOverlay extends StatusOverlay {
   override preInitialize(): void {
      // initialize the container in pre request model as otherwise the HTML container is on the wrong root that gets replaced
   }

   preRequestModel(): void {
      this.show(this.editorContext.modelRoot);
   }
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
