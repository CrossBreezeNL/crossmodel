/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { RELATIONSHIP_EDGE_TYPE } from '@crossbreeze/protocol';
import { GEdge, GEdgeBuilder } from '@eclipse-glsp/server';
import { RelationshipEdge } from '../../../language-server/generated/ast.js';
import { SystemModelIndex } from './system-model-index.js';

export class GRelationshipEdge extends GEdge {
   override type = RELATIONSHIP_EDGE_TYPE;

   static override builder(): GRelationshipEdgeBuilder {
      return new GRelationshipEdgeBuilder(GRelationshipEdge).type(RELATIONSHIP_EDGE_TYPE);
   }
}

export class GRelationshipEdgeBuilder extends GEdgeBuilder<GRelationshipEdge> {
   set(edge: RelationshipEdge, index: SystemModelIndex): this {
      this.id(index.createId(edge));
      this.addCssClasses('diagram-edge', 'relationship');
      this.addArg('edgePadding', 5);

      const sourceId = index.createId(edge.sourceNode?.ref);
      const targetId = index.createId(edge.targetNode?.ref);

      this.sourceId(sourceId || '');
      this.targetId(targetId || '');

      return this;
   }
}
