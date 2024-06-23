/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ENTITY_NODE_TYPE, REFERENCE_CONTAINER_TYPE, REFERENCE_PROPERTY, REFERENCE_VALUE } from '@crossbreeze/protocol';
import { ArgsUtil, GNode, GNodeBuilder } from '@eclipse-glsp/server';
import { EntityNode } from '../../../language-server/generated/ast.js';
import { getAttributes } from '../../../language-server/util/ast-util.js';
import { AttributeCompartment, AttributesCompartmentBuilder, createHeader } from '../../common/nodes.js';
import { SystemModelIndex } from './system-model-index.js';

export class GEntityNode extends GNode {
   override type = ENTITY_NODE_TYPE;

   static override builder(): GEntityNodeBuilder {
      return new GEntityNodeBuilder(GEntityNode).type(ENTITY_NODE_TYPE);
   }
}

export class GEntityNodeBuilder extends GNodeBuilder<GEntityNode> {
   set(node: EntityNode, index: SystemModelIndex): this {
      this.id(index.createId(node));

      // Get the reference that the DiagramNode holds to the Entity in the .langium file.
      const entityRef = node.entity?.ref;

      // Options which are the same for every node
      this.addCssClasses('diagram-node', 'entity');
      this.addArg(REFERENCE_CONTAINER_TYPE, EntityNode);
      this.addArg(REFERENCE_PROPERTY, 'entity');
      this.addArg(REFERENCE_VALUE, node.entity.$refText);

      // Add the label/name of the node
      this.add(createHeader(entityRef?.name || entityRef?.id || 'unresolved', this.proxy.id));

      // Add the children of the node
      const attributes = getAttributes(node);
      const attributesCompartment = new AttributesCompartmentBuilder().set(this.proxy.id);
      for (const attribute of attributes) {
         const attributeNode = AttributeCompartment.builder().set(attribute, index);
         attributeNode.addArg('identifier', attribute.identifier);
         attributesCompartment.add(attributeNode.build());
      }
      this.add(attributesCompartment.build());

      // The DiagramNode in the langium file holds the coordinates of node
      this.layout('vbox')
         .addArgs(ArgsUtil.cornerRadius(3))
         .addLayoutOption('prefWidth', node.width || 100)
         .addLayoutOption('prefHeight', node.height || 100)
         .position(node.x || 100, node.y || 100);

      return this;
   }
}
