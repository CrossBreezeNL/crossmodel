/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   EdgeCreationTool,
   FeatureModule,
   GLSPScrollMouseListener,
   TYPES,
   bindAsService,
   edgeCreationToolModule,
   viewportModule
} from '@eclipse-glsp/client';
import { RestoreViewportHandler } from '@eclipse-glsp/client/lib/features/viewport/viewport-handler';
import { CrossModelRestoreViewportHandler } from './crossmodel-viewport-handler';
import { DragEdgeCreationTool } from './drag-creation-tool';
import { LiteralCreationPalette } from './literal-creation-tool';
import { MappingEdgeCreationTool } from './mapping-edge-creation-tool';
import { NoScrollOverNodeListener } from './scroll-mouse-listener';

export const mappingEdgeCreationToolModule = new FeatureModule(
   (bind, unbind, isBound, rebind) => {
      const context = { bind, unbind, isBound, rebind };
      bindAsService(context, TYPES.IDefaultTool, DragEdgeCreationTool);
      bindAsService(bind, TYPES.IUIExtension, LiteralCreationPalette);
      rebind(EdgeCreationTool).to(MappingEdgeCreationTool).inSingletonScope();
      rebind(GLSPScrollMouseListener).to(NoScrollOverNodeListener).inSingletonScope();
      rebind(RestoreViewportHandler).to(CrossModelRestoreViewportHandler).inSingletonScope();
   },
   { requires: [edgeCreationToolModule, viewportModule] }
);
