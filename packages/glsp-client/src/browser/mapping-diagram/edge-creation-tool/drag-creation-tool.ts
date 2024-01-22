/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE } from '@crossbreeze/protocol';
import {
   Action,
   BaseEditTool,
   DragAwareMouseListener,
   GModelElement,
   Point,
   TriggerEdgeCreationAction,
   findParentByFeature
} from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { AttributeCompartment } from '../../model';
import { TargetObjectNode } from '../model';
import { MappingEdgeCreationArgs } from './mapping-edge-creation-tool';

/**
 * A tool that is always enabled to track when the user wants to start using our edge creation tool.
 */
@injectable()
export class DragEdgeCreationTool extends BaseEditTool {
   static readonly ID = 'mapping-edge-creation-tool';

   get id(): string {
      return DragEdgeCreationTool.ID;
   }

   override enable(): void {
      this.toDisposeOnDisable.push(this.mouseTool.registerListener(new DragEdgeCreationMouseListener()));
   }
}

export class DragEdgeCreationMouseListener extends DragAwareMouseListener {
   protected mappingEdgeCreationArgs?: MappingEdgeCreationArgs;
   protected dragStart?: Point;

   override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
      const result = super.mouseMove(target, event);
      const attributeCompartment = findParentByFeature(target, AttributeCompartment.is);
      if (attributeCompartment) {
         const targetObject = findParentByFeature(attributeCompartment, TargetObjectNode.is);
         this.mappingEdgeCreationArgs = {
            sourceAttributeId: attributeCompartment.id,
            sourceAttributeParent: !targetObject ? 'source-object' : 'target-object'
         };
      } else {
         this.mappingEdgeCreationArgs = undefined;
      }

      if (this.mappingEdgeCreationArgs) {
         this.dragStart = { x: event.clientX, y: event.clientY };
      }
      return result;
   }

   override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
      const result: Action[] = super.mouseMove(target, event);
      if (this.dragStart && this.mappingEdgeCreationArgs) {
         const dragDistance = Point.maxDistance(this.dragStart, { x: event.clientX, y: event.clientY });
         if (dragDistance > 3) {
            result.push(TriggerEdgeCreationAction.create(TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE, { args: this.mappingEdgeCreationArgs }));
         }
      }
      return result;
   }

   override nonDraggingMouseUp(_element: GModelElement, _event: MouseEvent): Action[] {
      this.mappingEdgeCreationArgs = undefined;
      return [];
   }
}
