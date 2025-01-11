/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   Action,
   Connectable,
   CreateEdgeOperation,
   CursorCSS,
   Disposable,
   DragAwareMouseListener,
   EdgeCreationTool,
   FeedbackEmitter,
   GEdge,
   GModelElement,
   HoverFeedbackAction,
   IActionDispatcher,
   ITypeHintProvider,
   ModifyCSSFeedbackAction,
   Point,
   TriggerEdgeCreationAction,
   cursorFeedbackAction,
   findParentByFeature,
   isConnectable
} from '@eclipse-glsp/client';
import {
   DrawFeedbackEdgeAction,
   RemoveFeedbackEdgeAction
} from '@eclipse-glsp/client/lib/features/tools/edge-creation/dangling-edge-feedback';
import { injectable } from '@theia/core/shared/inversify';

const CSS_EDGE_CREATION = 'edge-creation';

@injectable()
export class SystemEdgeCreationTool extends EdgeCreationTool {
   protected override creationListener(): void {
      const creationListener = new SystemEdgeCreationToolMouseListener(
         this.triggerAction,
         this.actionDispatcher,
         this.typeHintProvider,
         this
      );
      this.toDisposeOnDisable.push(creationListener, this.mouseTool.registerListener(creationListener));
   }
}

export interface ConnectionContext {
   element?: GModelElement & Connectable;
   canConnect?: boolean;
}

export interface DragConnectionContext {
   element: GModelElement & Connectable;
   dragStart: Point;
}

export class SystemEdgeCreationToolMouseListener extends DragAwareMouseListener implements Disposable {
   protected source?: string;
   protected target?: string;
   protected proxyEdge: GEdge;

   protected dragContext?: DragConnectionContext;
   protected mouseMoveFeedback: FeedbackEmitter;
   protected sourceFeedback: FeedbackEmitter;
   protected feedbackEdgeFeedback: FeedbackEmitter;

   constructor(
      protected triggerAction: TriggerEdgeCreationAction,
      protected actionDispatcher: IActionDispatcher,
      protected typeHintProvider: ITypeHintProvider,
      protected tool: EdgeCreationTool
   ) {
      super();
      this.proxyEdge = new GEdge();
      this.proxyEdge.type = triggerAction.elementTypeId;
      this.feedbackEdgeFeedback = tool.createFeedbackEmitter();
      this.mouseMoveFeedback = tool.createFeedbackEmitter();
      this.sourceFeedback = tool.createFeedbackEmitter();
   }

   protected isSourceSelected(): boolean {
      return this.source !== undefined;
   }

   protected isTargetSelected(): boolean {
      return this.target !== undefined;
   }

   override mouseDown(target: GModelElement, event: MouseEvent): Action[] {
      const result = super.mouseDown(target, event);
      if (event.button === 0 && !this.isSourceSelected()) {
         // update the current target
         const context = this.calculateContext(target, event);
         if (context.element && context.canConnect) {
            this.dragContext = { element: context.element, dragStart: { x: event.clientX, y: event.clientY } };
         }
      }
      return result;
   }

   override mouseMove(target: GModelElement, event: MouseEvent): Action[] {
      const result = super.mouseMove(target, event);
      if (this.isMouseDrag && this.dragContext && !this.isSourceSelected()) {
         const dragDistance = Point.maxDistance(this.dragContext.dragStart, { x: event.clientX, y: event.clientY });
         if (dragDistance > 3) {
            // assign source if possible
            this.source = this.dragContext.element.id;
            this.feedbackEdgeFeedback
               .add(
                  DrawFeedbackEdgeAction.create({ elementTypeId: this.triggerAction.elementTypeId, sourceId: this.source }),
                  RemoveFeedbackEdgeAction.create()
               )
               .submit();

            this.dragContext = undefined;
         }
      }
      this.updateFeedback(target, event);
      return result;
   }

   override draggingMouseUp(target: GModelElement, event: MouseEvent): Action[] {
      const result = super.draggingMouseUp(target, event);
      if (this.isSourceSelected()) {
         const context = this.calculateContext(target, event);
         if (context.element && context.canConnect) {
            this.target = context.element.id;
            result.push(
               CreateEdgeOperation.create({
                  elementTypeId: this.triggerAction.elementTypeId,
                  sourceElementId: this.source!,
                  targetElementId: this.target,
                  args: this.triggerAction.args
               })
            );
         }
      }
      this.dispose();
      this.updateFeedback(target, event);
      return result;
   }

   override nonDraggingMouseUp(element: GModelElement, event: MouseEvent): Action[] {
      this.dispose();
      this.updateFeedback(element, event);
      return [];
   }

   protected canConnect(element: GModelElement | undefined, role: 'source' | 'target'): boolean {
      return (
         !!element &&
         !!isConnectable(element) &&
         element.canConnect(this.proxyEdge, role) &&
         (role !== 'target' || this.source !== element?.id)
      );
   }

   protected updateFeedback(target: GModelElement, event: MouseEvent): void {
      const context = this.calculateContext(target, event);

      // source element feedback
      if (this.isSourceSelected()) {
         this.sourceFeedback
            .add(
               HoverFeedbackAction.create({ mouseoverElement: this.source!, mouseIsOver: true }),
               HoverFeedbackAction.create({ mouseoverElement: this.source!, mouseIsOver: false })
            )
            .submit();
      }

      // cursor feedback
      if (!context.element || context.element?.id === this.source) {
         // by default we want to use the edge creation CSS when the tool is active
         this.registerFeedback(
            [ModifyCSSFeedbackAction.create({ add: [CSS_EDGE_CREATION] })],
            [ModifyCSSFeedbackAction.create({ remove: [CSS_EDGE_CREATION] })]
         );
         return;
      }

      if (!context.canConnect) {
         this.registerFeedback([cursorFeedbackAction(CursorCSS.OPERATION_NOT_ALLOWED)], [cursorFeedbackAction()]);
         return;
      }

      const cursorCss = this.isSourceSelected() ? CursorCSS.EDGE_CREATION_TARGET : CursorCSS.EDGE_CREATION_SOURCE;
      this.registerFeedback(
         [cursorFeedbackAction(cursorCss), HoverFeedbackAction.create({ mouseoverElement: context.element.id, mouseIsOver: true })],
         [cursorFeedbackAction(), HoverFeedbackAction.create({ mouseoverElement: context.element.id, mouseIsOver: false })]
      );
   }

   protected registerFeedback(feedbackActions: Action[], cleanupActions?: Action[]): void {
      this.mouseMoveFeedback.dispose();
      feedbackActions.forEach(action => this.mouseMoveFeedback.add(action));
      if (cleanupActions) {
         this.mouseMoveFeedback.add(undefined, cleanupActions);
      }
      this.mouseMoveFeedback.submit();
   }

   protected calculateContext(target: GModelElement, event: MouseEvent, previousContext?: ConnectionContext): ConnectionContext {
      const context: ConnectionContext = {};
      context.element = findParentByFeature(target, isConnectable);
      if (previousContext && previousContext.element === context.element) {
         return previousContext;
      }
      if (!this.isSourceSelected()) {
         context.canConnect = this.canConnect(context.element, 'source');
      } else if (!this.isTargetSelected()) {
         context.canConnect = this.canConnect(context.element, 'target');
      } else {
         context.canConnect = false;
      }
      return context;
   }

   override dispose(): void {
      super.dispose();
      this.source = undefined;
      this.target = undefined;
      this.feedbackEdgeFeedback.dispose();
      this.mouseMoveFeedback.dispose();
      this.sourceFeedback.dispose();
   }
}
