/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { FeatureModule, GlspHoverMouseListener, hoverModule } from '@eclipse-glsp/client';
import { SystemHoverListener } from './hover-listener';

export const systemHoverModule = new FeatureModule(
   (bind, unbind, isBound, rebind) => {
      bind(SystemHoverListener).toSelf().inSingletonScope();
      rebind(GlspHoverMouseListener).toService(SystemHoverListener);
   },
   { featureId: Symbol('system-hover'), requires: hoverModule }
);
