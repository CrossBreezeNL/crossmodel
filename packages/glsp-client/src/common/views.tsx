/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/
/** @jsx svg */
/* eslint-disable react/no-unknown-property */
import { isLeftPortId, isRightPortId } from '@crossbreezenl/protocol';
import { GPort, IViewArgs, RenderingContext, ShapeView, svg } from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';
import { VNode } from 'snabbdom';

@injectable()
export class PortView extends ShapeView {
   render(port: GPort, context: RenderingContext, args?: IViewArgs): VNode | undefined {
      if (!this.isVisible(port, context)) {
         return undefined;
      }
      return (
         <g class-port-left={isLeftPortId(port.id)} class-port-right={isRightPortId(port.id)}>
            <path
               class-sprotty-port={port instanceof GPort}
               class-mouseover={port.hoverFeedback}
               class-selected={port.selected}
               d={this.getPath(port, context)}
            />
         </g>
      );
   }

   protected getPath(port: GPort, context: RenderingContext): string {
      const padding = 6;
      const height = port.size.height - padding;
      return isLeftPortId(port.id)
         ? `M ${port.size.width} ${padding / 2} a 1 1 0 0 0 0 ${height} Z`
         : `M 0 ${padding / 2} a 1 1 0 0 1 0 ${height} Z`;
   }
}
