/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ATTRIBUTE_COMPARTMENT_TYPE } from '@crossbreeze/protocol';
import { Args, ArgsAware, GCompartment, GModelElement, Hoverable, Selectable, isSelectable } from '@eclipse-glsp/client';

export class AttributeCompartment extends GCompartment implements Selectable, Hoverable, ArgsAware {
   hoverFeedback: boolean;
   selected: boolean;
   args?: Args;

   static is(element?: GModelElement): element is AttributeCompartment {
      return !!element && isSelectable(element) && element.type === ATTRIBUTE_COMPARTMENT_TYPE;
   }
}
