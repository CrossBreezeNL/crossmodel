/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ATTRIBUTE_COMPARTMENT_TYPE, createLeftPortId, createRightPortId } from '@crossbreeze/protocol';
import { GCompartment, GLabel, GPort } from '@eclipse-glsp/server';
import { Attribute } from '../../language-server/generated/ast.js';
import { CrossModelIndex } from './cross-model-index.js';

export function createHeader(text: string, containerId: string): GCompartment {
   return GCompartment.builder()
      .id(`${containerId}_header`)
      .layout('hbox')
      .addLayoutOption('hAlign', 'center')
      .addLayoutOption('vAlign', 'center')
      .addLayoutOption('paddingTop', 3)
      .addCssClass('header-compartment')
      .add(GLabel.builder().text(text).id(`${containerId}_label`).addCssClass('header-label').build())
      .build();
}

export function createAttributesCompartment(attributes: Attribute[], containerId: string, index: CrossModelIndex): GCompartment {
   const attributesContainer = GCompartment.builder()
      .id(`${containerId}_attributes`)
      .addCssClass('attributes-compartment')
      .layout('vbox')
      .addLayoutOption('hAlign', 'left')
      .addLayoutOption('paddingBottom', 0);

   // Add the attributes of the entity.
   for (const attribute of attributes) {
      attributesContainer.add(createAttributeCompartment(attribute, index));
   }
   return attributesContainer.build();
}

export function createAttributeCompartment(attribute: Attribute, index: CrossModelIndex): GCompartment {
   const attributeId = index.createId(attribute);
   const attributeCompartment = GCompartment.builder()
      .id(attributeId)
      .type(ATTRIBUTE_COMPARTMENT_TYPE)
      .addCssClass('attribute-compartment')
      .layout('hbox')
      .addLayoutOption('paddingBottom', 3)
      .addLayoutOption('paddingTop', 3)
      .addLayoutOption('hGap', 3);

   const leftPortId = createLeftPortId(attributeId);
   index.indexSemanticElement(leftPortId, attribute);
   attributeCompartment.add(GPort.builder().id(leftPortId).build());

   attributeCompartment.add(
      GLabel.builder()
         .id(`${attributeId}_attribute_name`)
         .text(attribute.name || '')
         .addCssClass('attribute')
         .build()
   );
   attributeCompartment.add(GLabel.builder().text(':').id(`${attributeId}_attribute_del`).build());
   attributeCompartment.add(
      GLabel.builder().id(`${attributeId}_attribute_datatype`).text(attribute.datatype).addCssClass('datatype').build()
   );
   const rightPortId = createRightPortId(attributeId);
   index.indexSemanticElement(rightPortId, attribute);
   attributeCompartment.add(GPort.builder().id(rightPortId).build());

   return attributeCompartment.build();
}
