/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { injectable } from 'inversify';
import { VNode } from 'snabbdom';
import { RectangularNodeView, RenderingContext, svg } from 'sprotty/lib';
import { EntityNode } from './model';
import { ReactNode } from '@theia/core/shared/react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JSX = { createElement: svg };

@injectable()
export class EntityNodeView extends RectangularNodeView {
    override render(node: EntityNode, context: RenderingContext): VNode {
        const rhombStr = 'M 0,28  L ' + node.bounds.width + ',28';

        const classNode: any = (
            <g>
                <defs>
                    <filter id='dropShadow'>
                        <feDropShadow dx='0.5' dy='0.5' stdDeviation='0.4' />
                    </filter>
                </defs>
                <rect x={0} y={0} rx={6} width={Math.max(0, node.bounds.width)} height={Math.max(0, node.bounds.height)} />

                {/* The renderChildren function will render SVG objects for the children of the node object. */}
                {context.renderChildren(node) as ReactNode}

                {node.children[1] && node.children[1].children.length > 0 ? <path d={rhombStr}></path> : ''}
            </g>
        );

        return classNode;
    }
}
