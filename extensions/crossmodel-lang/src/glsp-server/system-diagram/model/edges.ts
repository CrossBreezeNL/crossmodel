/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   INHERITANCE_EDGE_TYPE,
   REFERENCE_CONTAINER_TYPE,
   REFERENCE_PROPERTY,
   REFERENCE_VALUE,
   RELATIONSHIP_EDGE_TYPE
} from '@crossbreeze/protocol';
import { GEdge, GEdgeBuilder } from '@eclipse-glsp/server';
import { InheritanceEdge, RelationshipEdge } from '../../../language-server/generated/ast.js';
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
      this.addArg(REFERENCE_CONTAINER_TYPE, RelationshipEdge);
      this.addArg(REFERENCE_PROPERTY, 'relationship');
      this.addArg(REFERENCE_VALUE, edge.relationship.$refText);

      const sourceId = index.createId(edge.sourceNode?.ref);
      const targetId = index.createId(edge.targetNode?.ref);

      this.sourceId(sourceId || '');
      this.targetId(targetId || '');

      return this;
   }
}

export class GInheritanceEdge extends GEdge {
   override type = INHERITANCE_EDGE_TYPE;

   static override builder(): GInheritanceEdgeBuilder {
      return new GInheritanceEdgeBuilder(GInheritanceEdge).type(INHERITANCE_EDGE_TYPE);
   }
}

export class GInheritanceEdgeBuilder extends GEdgeBuilder<GInheritanceEdge> {
   set(edge: InheritanceEdge, index: SystemModelIndex): this {
      this.id(index.createId(edge));
      this.addCssClasses('diagram-edge', 'inheritance');
      this.addArg('edgePadding', 5);
      const sourceId = index.createId(edge.baseNode?.ref);
      const targetId = index.createId(edge.superNode?.ref);

      this.sourceId(sourceId || '');
      this.targetId(targetId || '');
      return this;
   }
}
