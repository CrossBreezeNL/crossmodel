/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { SOURCE_NUMBER_NODE_TYPE, SOURCE_OBJECT_NODE_TYPE, SOURCE_STRING_NODE_TYPE, TARGET_OBJECT_NODE_TYPE } from '@crossbreeze/protocol';
import { ArgsUtil, GNode, GNodeBuilder } from '@eclipse-glsp/server';
import { NumberLiteral, SourceObject, StringLiteral, TargetObject } from '../../../language-server/generated/ast.js';
import { getAttributes } from '../../../language-server/util/ast-util.js';
import { createAttributesCompartment, createHeader } from '../../common/nodes.js';
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

export class GNumberLiteralNode extends GNode {
   override type = SOURCE_NUMBER_NODE_TYPE;

   static override builder(): GNumberLiteralNodeBuilder {
      return new GNumberLiteralNodeBuilder(GNumberLiteralNode).type(SOURCE_NUMBER_NODE_TYPE);
   }
}

export class GNumberLiteralNodeBuilder extends GNodeBuilder<GNumberLiteralNode> {
   set(node: NumberLiteral, index: MappingModelIndex): this {
      this.id(index.createId(node));

      this.addCssClasses('diagram-node', 'source-object', 'number-literal');

      this.add(createHeader(node.value + '', this.proxy.id));

      this.layout('vbox')
         .addArgs(ArgsUtil.cornerRadius(3))
         .addLayoutOption('prefWidth', 20)
         .addLayoutOption('prefHeight', 20)
         .position(100, 100);

      return this;
   }
}

export class GStringLiteralNode extends GNode {
   override type = SOURCE_STRING_NODE_TYPE;

   static override builder(): GStringLiteralNodeBuilder {
      return new GStringLiteralNodeBuilder(GStringLiteralNode).type(SOURCE_STRING_NODE_TYPE);
   }
}

export class GStringLiteralNodeBuilder extends GNodeBuilder<GStringLiteralNode> {
   set(node: StringLiteral, index: MappingModelIndex): this {
      this.id(index.createId(node));

      this.addCssClasses('diagram-node', 'source-object', 'string-literal');

      this.add(createHeader(JSON.stringify(node.value), this.proxy.id));

      this.layout('vbox')
         .addArgs(ArgsUtil.cornerRadius(3))
         .addLayoutOption('prefWidth', 20)
         .addLayoutOption('prefHeight', 20)
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
      this.id(index.createId(node));

      // Options which are the same for every node
      this.addCssClasses('diagram-node', 'target-node');

      // Add the label/name of the node
      this.add(createHeader(node.entity?.ref?.name || 'unresolved', this.proxy.id));

      // Add the children of the node
      const attributes = getAttributes(node);
      this.add(createAttributesCompartment(attributes, this.proxy.id, index));

      this.layout('vbox').addArgs(ArgsUtil.cornerRadius(3)).addLayoutOption('prefWidth', 100).addLayoutOption('prefHeight', 100);
      return this;
   }
}
