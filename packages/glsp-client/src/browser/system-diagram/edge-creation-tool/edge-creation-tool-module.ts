/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { EdgeCreationTool, FeatureModule, edgeCreationToolModule, viewportModule } from '@eclipse-glsp/client';
import { SystemEdgeCreationTool } from './system-edge-creation-tool';

export const systemEdgeCreationToolModule = new FeatureModule(
   (bind, unbind, isBound, rebind) => {
      const context = { bind, unbind, isBound, rebind };
      context.rebind(EdgeCreationTool).to(SystemEdgeCreationTool).inSingletonScope();
   },
   { requires: [edgeCreationToolModule, viewportModule] }
);
