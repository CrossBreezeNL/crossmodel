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
import { DragEdgeCreationTool } from './drag-creation-tool';
import { MappingEdgeCreationTool } from './mapping-edge-creation-tool';
import { NoScrollOverNodeListener } from './scroll-mouse-listener';
import { LiteralCreationPalette } from './literal-creation-tool';

export const mappingEdgeCreationToolModule = new FeatureModule(
   (bind, unbind, isBound, rebind) => {
      const context = { bind, unbind, isBound, rebind };
      bindAsService(context, TYPES.IDefaultTool, DragEdgeCreationTool);
      bindAsService(bind, TYPES.IUIExtension, LiteralCreationPalette);
      rebind(EdgeCreationTool).to(MappingEdgeCreationTool).inSingletonScope();
      rebind(GLSPScrollMouseListener).to(NoScrollOverNodeListener).inSingletonScope();
   },
   { requires: [edgeCreationToolModule, viewportModule] }
);
