/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { bindAsService, FeatureModule, TYPES } from '@eclipse-glsp/client';
import { SourceObjectCreationTool } from './source-object-creation-tool';

export const sourceObjectCreationToolModule = new FeatureModule(
   (bind, unbind, isBound, rebind) => {
      const context = { bind, unbind, isBound, rebind };
      bindAsService(context, TYPES.ITool, SourceObjectCreationTool);
   },
   { featureId: Symbol('sourceObjectCreationTool') }
);
