/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE, createLeftPortId, createRightPortId } from '@crossbreeze/protocol';
import { GEdge, GEdgeBuilder } from '@eclipse-glsp/server';
import { AttributeMapping, isReferenceSource } from '../../../language-server/generated/ast.js';
import { MappingModelIndex } from './mapping-model-index.js';

export class GTargetObjectEdge extends GEdge {
   override type = TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE;

   static override builder(): GTargeMappingEdgeBuilder {
      return new GTargeMappingEdgeBuilder(GTargetObjectEdge).type(TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE);
   }
}

export class GTargeMappingEdgeBuilder extends GEdgeBuilder<GTargetObjectEdge> {
   set(mapping: AttributeMapping, index: MappingModelIndex): this {
      this.id(index.createId(mapping));
      this.addCssClasses('diagram-edge', 'mapping-edge', 'attribute-mapping');
      this.addArg('edgePadding', 5);

      const sourceId = isReferenceSource(mapping.source)
         ? createRightPortId(index.createId(mapping.source.value.ref))
         : index.createId(mapping.source);
      const targetId = createLeftPortId(index.createId(mapping.attribute));

      this.sourceId(sourceId);
      this.targetId(targetId);
      return this;
   }
}
