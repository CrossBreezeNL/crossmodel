/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
/** @jsx svg */
/* eslint-disable react/no-unknown-property */
/* eslint-disable react/jsx-key */
import { GEdgeView, GGraph, GGraphView, RenderingContext, TYPES, ViewerOptions, svg } from '@eclipse-glsp/client';
import { inject } from '@theia/core/shared/inversify';
import { injectable } from 'inversify';
import { ReactNode } from 'react';
import { VNode, VNodeStyle } from 'snabbdom';
import { DiagramNodeView } from '../views';

@injectable()
export class EntityNodeView extends DiagramNodeView {}

@injectable()
export class RelationshipEdgeView extends GEdgeView {}

@injectable()
export class InheritanceEdgeView extends GEdgeView {}

const MARKER_INHERITANCE_ID = 'marker-inheritance';
const MARKER_INHERITANCE_SELECTED_ID = 'marker-inheritance-selected';
export class SystemGraphView extends GGraphView {
   @inject(TYPES.ViewerOptions) protected viewerOptions: ViewerOptions;

   protected createDefId(id: string): string {
      return `${this.viewerOptions.baseDiv}__svg__def__${id}`;
   }

   override render(model: Readonly<GGraph>, context: RenderingContext): VNode {
      const edgeRouting = this.edgeRouterRegistry.routeAllChildren(model);
      const transform = `scale(${model.zoom}) translate(${-model.scroll.x},${-model.scroll.y})`;
      const graph: any = (
         <svg class-sprotty-graph={true}>
            <g transform={transform}>
               {this.renderAdditionals(context) as ReactNode}
               {context.renderChildren(model, { edgeRouting }) as ReactNode}
            </g>
         </svg>
      );
      if (graph.data) {
         graph.data.style = { ...graph.data.style, ...this.getGridStyle(model, context), ...this.renderStyle(context) };
      }
      return graph;
   }

   protected renderAdditionals(context: RenderingContext): VNode[] {
      const directedEdgeAdds: any = [
         <defs>
            <marker
               id={this.createDefId(MARKER_INHERITANCE_ID)}
               viewBox='0 0 10 10'
               refX='10'
               refY='5'
               markerUnits='userSpaceOnUse'
               markerWidth='20'
               markerHeight='20'
               orient='auto-start-reverse'
            >
               <path d='M 0 0 L 10 5 L 0 10 L 0 0 z' stroke='var(--sprotty-edge)' fill='var(--sprotty-background)' />
            </marker>
            <marker
               id={this.createDefId(MARKER_INHERITANCE_SELECTED_ID)}
               viewBox='0 0 10 10'
               refX='10'
               refY='5'
               markerUnits='userSpaceOnUse'
               markerWidth='20'
               markerHeight='20'
               orient='auto-start-reverse'
            >
               <path d='M 0 0 L 10 5 L 0 10 L 0 0 z' stroke='var(--sprotty-edge-selected)' fill='var(--sprotty-background)' />
            </marker>
         </defs>
      ];

      return directedEdgeAdds;
   }

   protected renderStyle(context: RenderingContext): VNodeStyle {
      return {
         height: '100%',
         '--svg-def-marker-inheritance': `url(#${this.createDefId(MARKER_INHERITANCE_ID)})`,
         '--svg-def-marker-inheritance-selected': `url(#${this.createDefId(MARKER_INHERITANCE_SELECTED_ID)})`
      };
   }
}
