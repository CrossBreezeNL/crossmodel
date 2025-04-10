/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE } from '@crossbreezenl/protocol';
import {
   Action,
   BaseEditTool,
   CursorCSS,
   DragAwareMouseListener,
   FeedbackEmitter,
   GModelElement,
   ModifyCSSFeedbackAction,
   Point,
   TriggerEdgeCreationAction,
   cursorFeedbackAction,
   findParentByFeature
} from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { AttributeCompartment } from '../../model';
import { TargetObjectNode } from '../model';
import { MappingEdgeCreationArgs } from './mapping-edge-creation-tool';

const CSS_MAPPING_CREATION = 'mapping-creation';

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
      const listener = new DragEdgeCreationMouseListener(this);
      this.toDisposeOnDisable.push(listener);
      this.toDisposeOnDisable.push(this.mouseTool.registerListener(listener));
   }
}

export class DragEdgeCreationMouseListener extends DragAwareMouseListener {
   protected mappingEdgeCreationArgs?: MappingEdgeCreationArgs;
   protected dragStart?: Point;
   protected diagramFeedback: FeedbackEmitter;
   protected cursorFeedback: FeedbackEmitter;

   constructor(protected tool: DragEdgeCreationTool) {
      super();
      this.diagramFeedback = tool.createFeedbackEmitter();
      this.diagramFeedback
         .add(
            ModifyCSSFeedbackAction.create({ add: [CSS_MAPPING_CREATION] }),
            ModifyCSSFeedbackAction.create({ remove: [CSS_MAPPING_CREATION] })
         )
         .submit();
      this.cursorFeedback = tool.createFeedbackEmitter();
   }

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
         if (dragDistance > 10) {
            result.push(TriggerEdgeCreationAction.create(TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE, { args: this.mappingEdgeCreationArgs }));
         }
      }
      return result;
   }

   override mouseOver(target: GModelElement, event: MouseEvent): Action[] {
      const attributeCompartment = findParentByFeature(target, AttributeCompartment.is);
      if (attributeCompartment) {
         this.cursorFeedback.revert();
      } else {
         this.cursorFeedback.add(cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED), cursorFeedbackAction()).submit();
      }
      return [];
   }

   override nonDraggingMouseUp(_element: GModelElement, _event: MouseEvent): Action[] {
      this.mappingEdgeCreationArgs = undefined;
      return [];
   }

   override dispose(): void {
      super.dispose();
      this.diagramFeedback.dispose();
      this.cursorFeedback.dispose();
   }
}
