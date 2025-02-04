/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   BoundsAware,
   Dimension,
   EditableLabel,
   GChildElement,
   GEdge,
   GLabel,
   GModelElement,
   GParentElement,
   isEditableLabel,
   isParent,
   ModelFilterPredicate,
   RectangularNode,
   WithEditableLabel
} from '@eclipse-glsp/client';

export class EntityNode extends RectangularNode implements WithEditableLabel {
   get editableLabel(): (GChildElement & EditableLabel) | undefined {
      return findElementBy(this, isEditableLabel) as (GChildElement & EditableLabel) | undefined;
   }
}

export class RelationshipEdge extends GEdge {}

export class InheritanceEdge extends GEdge {}

export class GEditableLabel extends GLabel implements EditableLabel {
   editControlPositionCorrection = {
      x: -9,
      y: -7
   };

   get editControlDimension(): Dimension {
      const parentBounds = (this.parent as any as BoundsAware).bounds;
      return {
         width: parentBounds?.width ? parentBounds?.width + 5 : this.bounds.width - 10,
         height: parentBounds?.height ? parentBounds.height + 3 : 100
      };
   }
}

export function findElementBy<T>(parent: GParentElement, predicate: ModelFilterPredicate<T>): (GModelElement & T) | undefined {
   if (predicate(parent)) {
      return parent;
   }
   if (isParent(parent)) {
      for (const child of parent.children) {
         const result = findElementBy(child, predicate);
         if (result !== undefined) {
            return result;
         }
      }
   }
   return undefined;
}
