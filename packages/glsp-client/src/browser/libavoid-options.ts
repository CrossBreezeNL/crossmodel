/********************************************************************************
 * MIT License
 * Copyright (c) 2019 Vladyslav Hnatiuk
 * https://github.com/Aksem/sprotty-routing-libavoid
 ********************************************************************************/

import { LibavoidRouteType } from './libavoid';

export const LibavoidEdgeRouterOptions = Symbol('LibavoidEdgeRouterOptions');

/**
 * Documentation taken from https://github.com/Aksem/sprotty-routing-libavoid
 */
export interface LibavoidRouterOptions {
   /**
    * This option causes the final segments of connectors, which are attached to shapes, to be nudged apart.
    * Usually these segments are fixed, since they are considered to be attached to ports.
    *
    * Default: false
    *
    * Note This option also causes routes running through the same checkpoint to be nudged apart.
    * This option has no effect if ::nudgeSharedPathsWithCommonEndPoint is set to false.
    *
    * Note: This will allow routes to be nudged up to the bounds of shapes.
    */
   nudgeOrthogonalSegmentsConnectedToShapes?: boolean;

   /**
    * This option causes hyperedge routes to be locally improved fixing obviously bad paths.
    * As part of this process libavoid will effectively move junctions, setting new ideal positions which can be
    * accessed via JunctionRef::recommendedPosition() for each junction.
    *
    * Default: true
    *
    * This will not add or remove junctions, so will keep the hyperedge topology the same.
    * Better routes can be achieved by enabling the ::improveHyperedgeRoutesMovingAddingAndDeletingJunctions option.
    *
    * If initial sensible positions for junctions in hyperedges are not known you can register those hyperedges with
    * the HyperedgeRerouter class for complete rerouting.
    */
   improveHyperedgeRoutesMovingJunctions?: boolean;

   /**
    * This option penalises and attempts to reroute orthogonal shared connector paths terminating at a common junction or shape
    * connection pin. When multiple connector paths enter or leave the same side of a junction (or shape pin), the router will
    * attempt to reroute these to different sides of the junction or different shape pins.
    *
    * Default: false
    *
    * This option depends on the ::fixedSharedPathPenalty penalty having been set.
    *
    * Note: This penalty is still experimental! It is not recommended for normal use.
    */
   penaliseOrthogonalSharedPathsAtConnEnds?: boolean;

   /**
    * This option can be used to control whether collinear line segments that touch just at their ends will be nudged apart.
    * The overlap will usually be resolved in the other dimension, so this is not usually required.
    *
    * Default: false
    */
   nudgeOrthogonalTouchingColinearSegments?: boolean;

   /**
    * This option can be used to control whether the router performs a preprocessing step before orthogonal nudging where is tries
    * to unify segments and centre them in free space. This generally results in better quality ordering and nudging.
    *
    * Default: false
    *
    * Note: You may wish to turn this off for large examples where it can be very slow and will make little difference.
    */
   performUnifyingNudgingPreprocessingStep?: boolean;

   /**
    * This option causes hyperedge routes to be locally improved fixing obviously bad paths.
    *
    * It can cause junctions and connectors to be added or removed from hyperedges.
    * As part of this process libavoid will effectively move junctions by setting new ideal positions for each remaining or added junction.
    *
    * Default: false
    *
    * If set, this option overrides the ::improveHyperedgeRoutesMovingJunctions option.
    */
   improveHyperedgeRoutesMovingAddingAndDeletingJunctions?: boolean;

   /**
    * This option determines whether intermediate segments of connectors that are attached to common endpoints will be nudged apart.
    * Usually these segments get nudged apart, but you may want to turn this off if you would prefer that entire shared paths terminating
    * at a common end point should overlap.
    *
    * Default: true
    */
   nudgeSharedPathsWithCommonEndPoint?: boolean;

   /**
    * Default: 20
    */
   minimalSegmentLengthForChildPosition?: number;
}

/**
 * Documentation taken from https://github.com/Aksem/sprotty-routing-libavoid
 */
export interface LibavoidRouterParameters {
   /**
    * This penalty is applied for each segment in the connector path beyond the first.
    * This should always normally be set when doing orthogonal routing to prevent step-like connector paths.
    *
    * Default: 10
    *
    * Note: This penalty must be set (i.e., be greater than zero) in order for orthogonal connector nudging to be performed, since
    * this requires reasonable initial routes.
    */
   segmentPenalty?: number;

   /**
    * This penalty is applied in its full amount to tight acute bends in the connector path.
    * A smaller portion of the penalty is applied for slight bends, i.e., where the bend is close to 180 degrees.
    * This is useful for polyline routing where there is some evidence that tighter corners are worse for readability,
    * but that slight bends might not be so bad, especially when smoothed by curves.
    *
    * Default: 0
    */
   anglePenalty?: number;

   /**
    * This penalty is applied whenever a connector path crosses another connector path.
    * It takes shared paths into consideration and the penalty is only applied if there is an actual crossing.
    *
    * Default: 0
    *
    * Note: This penalty is still experimental! It is not recommended for normal use.
    */
   crossingPenalty?: number;

   /**
    * This penalty is applied whenever a connector path crosses a cluster boundary.
    *
    * Default: 4000
    *
    * Note: This penalty is still experimental! It is not recommended for normal use.
    *
    * Note: This penalty is very slow.
    */
   clusterCrossingPenalty?: number;

   /**
    * This penalty is applied whenever a connector path shares some segments with an immovable
    * portion of an existing connector route (such as the first or last segment of a connector).
    *
    * Default: 0
    *
    * Note: This penalty is still experimental! It is not recommended for normal use.
    */
   fixedSharedPathPenalty?: number;

   /**
    * This penalty is applied to port selection choice when the other end of the connector being routed does not appear in
    * any of the 90 degree visibility cones centered on the visibility directions for the port.
    *
    * Default: 0
    *
    * Note: This penalty is still experimental! It is not recommended for normal use.
    *
    * Note: This penalty is very slow.
    */
   portDirectionPenalty?: number;

   /**
    * This parameter defines the spacing distance that will be added to the sides of each shape when determining obstacle sizes for routing.
    * This controls how closely connectors pass shapes, and can be used to prevent connectors overlapping with shape boundaries.
    *
    * Default: 0
    */
   shapeBufferDistance?: number;

   /**
    * This parameter defines the spacing distance that will be used for nudging apart overlapping corners and line segments of connectors.
    *
    * Default: 4
    */
   idealNudgingDistance?: number;

   /**
    * This penalty is applied whenever a connector path travels in the direction opposite of the destination from the source endpoint.
    * By default this penalty is set to zero. This shouldn't be needed in most cases but can be useful if you use penalties such
    * as ::crossingPenalty which cause connectors to loop around obstacles.
    *
    * Default: 0
    */
   reverseDirectionPenalty?: number;
}

/**
 * Documentation taken from https://github.com/Aksem/sprotty-routing-libavoid
 */
export interface LibavoidEdgeRouterConfiguration extends LibavoidRouterOptions, LibavoidRouterParameters {
   /**
    * Default: RouteType.PolyLine
    */
   routingType?: LibavoidRouteType;
}

export const DEFAULT_LIBAVOID_EDGE_ROUTER_CONFIG: LibavoidEdgeRouterConfiguration = {
   // Manhattan style routing
   routingType: LibavoidRouteType.Orthogonal,
   crossingPenalty: 100,
   reverseDirectionPenalty: 100,
   portDirectionPenalty: 100,
   segmentPenalty: 10,
   shapeBufferDistance: 100,
   fixedSharedPathPenalty: 100,
   performUnifyingNudgingPreprocessingStep: true,
   nudgeSharedPathsWithCommonEndPoint: true,
   penaliseOrthogonalSharedPathsAtConnEnds: true,
   // do not nudge on the ports as this might nudge out of the visual representation of the ports
   nudgeOrthogonalSegmentsConnectedToShapes: false,
   nudgeOrthogonalTouchingColinearSegments: true
};
