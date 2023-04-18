/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ArgsUtil, GCompartment, GLabel, GNode, GNodeBuilder } from '@eclipse-glsp/server';
import { DiagramNode } from '../../../language-server/generated/ast';

export class GEntityNode extends GNode {
   static override builder(): GEntityNodeBuilder {
      return new GEntityNodeBuilder(GEntityNode);
   }
}

export class GEntityNodeBuilder extends GNodeBuilder {
   addNode(node: DiagramNode): this {
      // Get the reference that the DiagramNode holds to the Entity in the .langium file.
      const entityRef = node.semanticElement.ref;

      // Options which are the same for every node
      this.addCssClasses('diagram-node', 'entity').layout('vbox').addArgs(ArgsUtil.cornerRadius(3));

      // We need the id before we can build the label and childeren.
      if (this.id === undefined) {
         throw new Error('Add id to builder before adding the node reference.');
      }

      // Add the label/name of the node
      const label = GCompartment.builder()
         .layout('hbox')
         .addLayoutOption('hAlign', 'center')
         .addLayoutOption('paddingBottom', 0)
         .addCssClass('header-container-diagram-node')
         .add(
            GLabel.builder()
               .text(entityRef?.name || 'unresolved')
               .id(`${this.proxy.id}_label`)
               .build()
         )
         .build();

      this.add(label);

      // Add the children of the node
      if (entityRef !== undefined) {
         const allAttributesCompartment = GCompartment.builder()
            .addCssClass('attributes-compartment')
            .layout('vbox')
            .addLayoutOption('hAlign', 'left')
            .addLayoutOption('paddingBottom', 0);

         // Add the attributes of the entity.
         for (const attribute of entityRef.attributes) {
            const attributeCompartment = GCompartment.builder()
               .addCssClass('attribute-compartment')
               .layout('hbox')
               .addLayoutOption('paddingBottom', 0);

            attributeCompartment.add(GLabel.builder().text(attribute.name).addCssClass('attribute').build());
            attributeCompartment.add(GLabel.builder().text(' : ').build());
            attributeCompartment.add(GLabel.builder().text(attribute.value.toString()).addCssClass('datatype').build());

            allAttributesCompartment.add(attributeCompartment.build());
         }

         this.add(allAttributesCompartment.build());
      }

      // The DiagramNode in the langium file holds the coordinates of node
      this.addLayoutOption('prefWidth', node.width).addLayoutOption('prefHeight', node.height).position(node.x, node.y);

      return this;
   }
}
