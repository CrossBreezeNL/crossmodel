/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Reference, ReferenceInfo } from 'langium';
import { DiagramNode, SystemDiagram } from '../generated/ast.js';

export function createNodeToEntityReference(root: SystemDiagram): ReferenceInfo {
    return {
        reference: {} as Reference,
        container: {
            $type: DiagramNode,
            $container: root,
            $containerProperty: 'nodes'
        },
        property: 'for'
    };
}
