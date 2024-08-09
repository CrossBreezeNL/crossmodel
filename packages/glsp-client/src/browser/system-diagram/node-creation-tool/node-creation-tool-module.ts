/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { FeatureModule, NodeCreationTool, nodeCreationToolModule, viewportModule } from '@eclipse-glsp/client';
import { SystemNodeCreationTool } from './system-node-creation-tool';

export const systemNodeCreationModule = new FeatureModule(
   (bind, unbind, isBound, rebind) => {
      const context = { bind, unbind, isBound, rebind };
      context.rebind(NodeCreationTool).to(SystemNodeCreationTool).inSingletonScope();
   },
   { requires: [nodeCreationToolModule, viewportModule] }
);
