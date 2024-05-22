/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { createLeftPortId, createRightPortId } from '@crossbreeze/protocol';
import {
   Action,
   AnchorComputerRegistry,
   Args,
   Bounds,
   CursorCSS,
   Disposable,
   EdgeCreationTool,
   EdgeCreationToolMouseListener,
   FeedbackEdgeEndMovingMouseListener,
   GConnectableElement,
   GLSPActionDispatcher,
   GModelElement,
   HoverFeedbackAction,
   IFeedbackActionDispatcher,
   ITypeHintProvider,
   MoveAction,
   Point,
   TriggerEdgeCreationAction,
   cursorFeedbackAction,
   findChildrenAtPosition,
   findParentByFeature,
   getAbsolutePosition,
   isBoundsAware,
   toAbsoluteBounds
} from '@eclipse-glsp/client';
import {
   DrawFeedbackEdgeAction,
   FeedbackEdgeEnd,
   RemoveFeedbackEdgeAction,
   feedbackEdgeEndId
} from '@eclipse-glsp/client/lib/features/tools/edge-creation/dangling-edge-feedback';
import { injectable } from 'inversify';
import { AttributeCompartment } from '../../model';
import { SourceObjectNode, TargetObjectNode } from '../model';

export type AttributeParent = 'target-object' | 'source-object';

export interface MappingEdgeCreationArgs extends Args {
   sourceAttributeId: string;
   sourceAttributeParent: AttributeParent;
}

export interface MappingEdgeCreationAction extends TriggerEdgeCreationAction {
   args: MappingEdgeCreationArgs;
}

export function revertAttributeParent(parent: AttributeParent): AttributeParent {
   return parent === 'source-object' ? 'target-object' : 'source-object';
}

@injectable()
export class MappingEdgeCreationTool extends EdgeCreationTool {
   protected override triggerAction: MappingEdgeCreationAction;

   override doEnable(): void {
      const feedbackListener = new MappingEdgeEndMovingListener(this.triggerAction, this.anchorRegistry, this.feedbackDispatcher);
      const creationListener = new MappingEdgeCreationToolMouseListener(
         this.triggerAction,
         this.actionDispatcher,
         this.typeHintProvider,
         this
      );

      this.toDisposeOnDisable.push(
         creationListener,
         feedbackListener,
         this.mouseTool.registerListener(creationListener),
         this.mouseTool.registerListener(feedbackListener),
         this.registerFeedback([cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED)], this, [
            RemoveFeedbackEdgeAction.create(),
            cursorFeedbackAction()
         ])
      );
   }
}

export class MappingEdgeEndMovingListener extends FeedbackEdgeEndMovingMouseListener {
   protected expectedParent: AttributeParent;
   protected lastSnappedElement?: AttributeCompartment;

   constructor(
      protected triggerAction: MappingEdgeCreationAction,
      anchorRegistry: AnchorComputerRegistry,
      feedbackDispatcher: IFeedbackActionDispatcher
   ) {
      super(anchorRegistry, feedbackDispatcher);
      this.expectedParent = revertAttributeParent(triggerAction.args.sourceAttributeParent);
   }

   override mouseMove({ root }: GModelElement, event: MouseEvent): Action[] {
      const edgeEnd = root.index.getById(feedbackEdgeEndId(root));
      if (!(edgeEnd instanceof FeedbackEdgeEnd) || !edgeEnd.feedbackEdge) {
         return [];
      }

      const actions: Action[] = [];
      const edge = edgeEnd.feedbackEdge;
      const position = getAbsolutePosition(edgeEnd, event);
      const target = findChildrenAtPosition(root, position).reverse()[0];

      if (this.lastSnappedElement) {
         actions.push(HoverFeedbackAction.create({ mouseoverElement: this.lastSnappedElement.id, mouseIsOver: false }));
      }

      const attributeCompartment = findAttribute(target, this.expectedParent);
      if (attributeCompartment && edge.source && isBoundsAware(edge.source)) {
         const targetPortId = createPortId(attributeCompartment.id, this.expectedParent);
         const targetPort = root.index.getById(targetPortId);
         if (targetPort instanceof GConnectableElement) {
            const anchor = this.computeAbsoluteAnchor(targetPort, Bounds.center(toAbsoluteBounds(edge.source)));
            this.lastSnappedElement = attributeCompartment;
            if (Point.euclideanDistance(anchor, edgeEnd.position) > 1) {
               actions.push(MoveAction.create([{ elementId: edgeEnd.id, toPosition: anchor }], { animate: false }));
            }
         }
      } else {
         actions.push(MoveAction.create([{ elementId: edgeEnd.id, toPosition: position }], { animate: false }));
         this.lastSnappedElement = undefined;
         this.feedbackDispatcher.registerFeedback(this, actions);
      }

      if (this.lastSnappedElement) {
         actions.push(HoverFeedbackAction.create({ mouseoverElement: this.lastSnappedElement.id, mouseIsOver: true }));
      }

      if (actions.length > 0) {
         this.feedbackDispatcher.registerFeedback(this, actions);
      }
      return [];
   }
}

export class MappingEdgeCreationToolMouseListener extends EdgeCreationToolMouseListener implements Disposable {
   constructor(
      protected override triggerAction: MappingEdgeCreationAction,
      actionDispatcher: GLSPActionDispatcher,
      typeHintProvider: ITypeHintProvider,
      tool: EdgeCreationTool
   ) {
      super(triggerAction, actionDispatcher, typeHintProvider, tool);
      this.source = createPortId(this.triggerAction.args.sourceAttributeId, this.triggerAction.args.sourceAttributeParent);
      this.tool.registerFeedback([
         DrawFeedbackEdgeAction.create({ elementTypeId: this.triggerAction.elementTypeId, sourceId: this.source })
      ]);
   }

   override mouseOver(target: GModelElement, _event: MouseEvent): Action[] {
      const otherAttributeParent = revertAttributeParent(this.triggerAction.args.sourceAttributeParent);
      const attributeTarget = findAttribute(target, otherAttributeParent);
      if (!attributeTarget) {
         this.allowedTarget = false;
      } else {
         const targetPortId = createPortId(attributeTarget.id, otherAttributeParent);
         this.currentTarget = target.root.index.getById(targetPortId);
         this.allowedTarget = !!this.currentTarget;
      }
      return [this.updateEdgeFeedback()];
   }

   dispose(): void {
      // do nothing
   }
}

function createPortId(attributeId: string, parent: AttributeParent): string {
   return parent === 'source-object' ? createRightPortId(attributeId) : createLeftPortId(attributeId);
}

function findAttribute(target: GModelElement, parent: AttributeParent): AttributeCompartment | undefined {
   const attributeCompartment = findParentByFeature(target, AttributeCompartment.is);
   const parentCheck = parent === 'source-object' ? SourceObjectNode.is : TargetObjectNode.is;
   return attributeCompartment && findParentByFeature(attributeCompartment, parentCheck) ? attributeCompartment : undefined;
}
