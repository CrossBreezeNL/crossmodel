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
   EnableDefaultToolsAction,
   FeedbackEdgeEndMovingMouseListener,
   GEdge,
   GLSPActionDispatcher,
   GModelElement,
   HoverFeedbackAction,
   ITypeHintProvider,
   ModifyCSSFeedbackAction,
   Point,
   TriggerEdgeCreationAction,
   cursorFeedbackAction,
   findParentByFeature,
   isConnectable,
   isCtrlOrCmd
} from '@eclipse-glsp/client';
import {
   DrawFeedbackEdgeAction,
   RemoveFeedbackEdgeAction
} from '@eclipse-glsp/client/lib/features/tools/edge-creation/dangling-edge-feedback';
import { injectable } from '@theia/core/shared/inversify';

const CSS_EDGE_CREATION = 'edge-creation';

@injectable()
export class SystemEdgeCreationTool extends EdgeCreationTool {
   override doEnable(): void {
      const mouseMovingFeedback = new FeedbackEdgeEndMovingMouseListener(this.anchorRegistry, this.feedbackDispatcher);
      const listener = new SystemEdgeCreationToolMouseListener(this.triggerAction, this.actionDispatcher, this.typeHintProvider, this);
      this.toDisposeOnDisable.push(
         listener,
         mouseMovingFeedback,
         this.mouseTool.registerListener(listener),
         this.mouseTool.registerListener(mouseMovingFeedback),
         this.registerFeedback([], this, [
            RemoveFeedbackEdgeAction.create(),
            cursorFeedbackAction(),
            ModifyCSSFeedbackAction.create({ remove: [CSS_EDGE_CREATION] })
         ])
      );
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
   protected mouseMoveFeedback?: Disposable;
   protected sourceFeedback?: Disposable;

   constructor(
      protected triggerAction: TriggerEdgeCreationAction,
      protected actionDispatcher: GLSPActionDispatcher,
      protected typeHintProvider: ITypeHintProvider,
      protected tool: EdgeCreationTool
   ) {
      super();
      this.proxyEdge = new GEdge();
      this.proxyEdge.type = triggerAction.elementTypeId;
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
            this.tool.registerFeedback([
               DrawFeedbackEdgeAction.create({ elementTypeId: this.triggerAction.elementTypeId, sourceId: this.source })
            ]);
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
            if (!isCtrlOrCmd(event)) {
               result.push(EnableDefaultToolsAction.create());
            }
         }
      }
      this.reinitialize();
      return result;
   }

   override nonDraggingMouseUp(_element: GModelElement, event: MouseEvent): Action[] {
      this.reinitialize();
      return [EnableDefaultToolsAction.create()];
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
         this.sourceFeedback = this.tool.registerFeedback(
            [HoverFeedbackAction.create({ mouseoverElement: this.source!, mouseIsOver: true })],
            this.proxyEdge,
            [HoverFeedbackAction.create({ mouseoverElement: this.source!, mouseIsOver: false })]
         );
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

   protected registerFeedback(feedbackActions: Action[], cleanupActions?: Action[]): Disposable {
      this.mouseMoveFeedback?.dispose();
      this.mouseMoveFeedback = this.tool.registerFeedback(feedbackActions, this, cleanupActions);
      return this.mouseMoveFeedback;
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

   protected reinitialize(): void {
      this.source = undefined;
      this.target = undefined;
      this.tool.registerFeedback([RemoveFeedbackEdgeAction.create()]);
      this.dragContext = undefined;
      this.mouseMoveFeedback?.dispose();
      this.sourceFeedback?.dispose();
   }

   dispose(): void {
      this.reinitialize();
   }
}
