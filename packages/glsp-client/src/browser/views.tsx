/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
/* eslint-disable react/no-unknown-property */

import { GCompartmentView, RenderingContext, RoundedCornerNodeView, RoundedCornerWrapper, svg } from '@eclipse-glsp/client';
import { ReactNode } from '@theia/core/shared/react';
import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { AttributeCompartment } from './model';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class DiagramNodeView extends RoundedCornerNodeView {
   protected override renderPath(wrapper: Readonly<RoundedCornerWrapper>, context: RenderingContext, inset: number): string {
      const path = super.renderPath(wrapper, context, inset);
      const node = wrapper.element;
      // render a separator line
      return node.children[1] && node.children[1].children.length > 0 ? path + ' M 0,28  L ' + wrapper.element.bounds.width + ',28' : path;
   }
}

@injectable()
export class AttributeCompartmentView extends GCompartmentView {
   override render(compartment: Readonly<AttributeCompartment>, context: RenderingContext): VNode | undefined {
      const translate = `translate(${compartment.bounds.x}, ${compartment.bounds.y})`;
      const vnode: any = (
         <g transform={translate}>
            <rect
               class-attribute={true}
               class-mouseover={compartment.hoverFeedback}
               class-selected={compartment.selected}
               x='0'
               y='0'
               width={Math.max(compartment.size.width, 0)}
               height={Math.max(compartment.size.height, 0)}
            ></rect>
            {context.renderChildren(compartment) as ReactNode}
         </g>
      ) as any;

      return vnode;
   }
}
