/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { FeatureModule, GEdge, TYPES } from '@eclipse-glsp/client';
import { FrontendApplication, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import {
   LibavoidRouterOptions as ILibavoidRouterOptions,
   LibavoidDiamondAnchor,
   LibavoidEllipseAnchor,
   LibavoidRectangleAnchor,
   LibavoidRouteOptions,
   LibavoidRouter,
   load as loadLibavoidRouter,
   RouteType
} from 'sprotty-routing-libavoid';

export const LibavoidRouterOptions = Symbol('LibavoidRouterOptions');
export const DEFAULT_LIBAVOID_ROUTER_OPTIONS: ILibavoidRouterOptions = {
   routingType: RouteType.Orthogonal,
   portDirectionPenalty: 10,
   shapeBufferDistance: 20,
   idealNudgingDistance: 4,
   fixedSharedPathPenalty: 10,
   nudgeSharedPathsWithCommonEndPoint: true,
   nudgeOrthogonalSegmentsConnectedToShapes: true,
   nudgeOrthogonalTouchingColinearSegments: true
};

export const libAvoidModule = new FeatureModule(
   bind => {
      bind(LibavoidRouter).toSelf().inSingletonScope();
      bind(LibavoidRouterOptions).toConstantValue(DEFAULT_LIBAVOID_ROUTER_OPTIONS);
      bind(TYPES.IEdgeRouter).toDynamicValue(ctx => {
         const router = ctx.container.get(LibavoidRouter);
         const options = ctx.container.get<ILibavoidRouterOptions>(LibavoidRouterOptions);
         router.setOptions(options);
         return router;
      });
      bind(TYPES.IAnchorComputer).to(LibavoidDiamondAnchor).inSingletonScope();
      bind(TYPES.IAnchorComputer).to(LibavoidEllipseAnchor).inSingletonScope();
      bind(TYPES.IAnchorComputer).to(LibavoidRectangleAnchor).inSingletonScope();
   },
   { featureId: Symbol('libAvoid') }
);

@injectable()
export class LibAvoidInitializer implements FrontendApplicationContribution {
   async configure(app: FrontendApplication): Promise<void> {
      try {
         await loadLibavoidRouter();
      } catch (error) {
         console.error('Failed to load libavoid router:', error);
      }
   }
}

export class LibAvoidEdge extends GEdge implements LibavoidRouteOptions {
   routeType = RouteType.Orthogonal;
}
