/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { RenderProps, SOURCE_OBJECT_NODE_TYPE, TARGET_OBJECT_NODE_TYPE } from '@crossbreeze/protocol';
import { ArgsUtil, GLabel, GNode, GNodeBuilder } from '@eclipse-glsp/server';
import { SourceObject, TargetObject, TargetObjectAttribute } from '../../../language-server/generated/ast.js';
import { getAttributes } from '../../../language-server/util/ast-util.js';
import { AttributeCompartment, AttributesCompartmentBuilder, createAttributesCompartment, createHeader } from '../../common/nodes.js';
import { MappingModelIndex } from './mapping-model-index.js';

export class GSourceObjectNode extends GNode {
   override type = SOURCE_OBJECT_NODE_TYPE;

   static override builder(): GSourceObjectNodeBuilder {
      return new GSourceObjectNodeBuilder(GSourceObjectNode).type(SOURCE_OBJECT_NODE_TYPE);
   }
}

export class GSourceObjectNodeBuilder extends GNodeBuilder<GSourceObjectNode> {
   set(node: SourceObject, index: MappingModelIndex): this {
      this.id(index.createId(node));

      this.addCssClasses('diagram-node', 'source-object', 'entity');

      this.add(createHeader(node.id || 'unresolved', this.proxy.id));

      // Add the children of the node
      const attributes = getAttributes(node);
      this.add(createAttributesCompartment(attributes, this.proxy.id, index));

      this.layout('vbox')
         .addArgs(ArgsUtil.cornerRadius(3))
         .addLayoutOption('prefWidth', 100)
         .addLayoutOption('prefHeight', 100)
         .position(100, 100);

      return this;
   }
}

export class GTargetObjectNode extends GNode {
   override type = TARGET_OBJECT_NODE_TYPE;

   static override builder(): GTargetObjectNodeBuilder {
      return new GTargetObjectNodeBuilder(GTargetObjectNode).type(TARGET_OBJECT_NODE_TYPE);
   }
}

export class GTargetObjectNodeBuilder extends GNodeBuilder<GTargetObjectNode> {
   set(node: TargetObject, index: MappingModelIndex): this {
      const id = index.createId(node);
      this.id(id);

      // Options which are the same for every node
      this.addCssClasses('diagram-node', 'target-node');

      // Add the label/name of the node
      this.add(createHeader(node.entity?.ref?.name || node.entity?.ref?.id || 'unresolved', id));

      // Add the children of the node
      const attributes = getAttributes(node);
      node.$container.sources.find;

      const attributesContainer = new AttributesCompartmentBuilder().set(id);
      for (const attribute of attributes) {
         const attrComp = AttributeCompartment.builder().set(attribute, index, (attr, attrId) => this.markExpression(node, attr, attrId));
         const mappingIdx = node.mappings.findIndex(mapping => mapping.attribute.value.ref === attribute);
         if (mappingIdx >= 0) {
            attrComp.addArg(RenderProps.TARGET_ATTRIBUTE_MAPPING_IDX, mappingIdx);
         }
         attributesContainer.add(attrComp.build());
      }
      this.add(attributesContainer.build());

      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(3)).addLayoutOption('prefWidth', 100).addLayoutOption('prefHeight', 100);
      return this;
   }

   protected markExpression(node: TargetObject, attribute: TargetObjectAttribute, id: string): GLabel | undefined {
      return node.mappings.some(mapping => mapping.attribute.value.ref === attribute && !!mapping.expression)
         ? GLabel.builder().id(`${id}_attribute_expression_marker`).text('𝑓ᵪ').addCssClasses('attribute_expression_marker').build()
         : undefined;
   }
}
