/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { AddEntityOperation } from '@crossmodel/protocol';
import {
   Action,
   GLSPMousePositionTracker,
   GModelElement,
   GModelRoot,
   GlspCommandPalette,
   InsertIndicator,
   LabeledAction,
   Point,
   getAbsoluteClientBounds
} from '@eclipse-glsp/client';
import { inject, injectable } from '@theia/core/shared/inversify';

@injectable()
export class CrossModelMousePositionTracker extends GLSPMousePositionTracker {
   clientPosition: Point | undefined;
   diagramOffset: Point | undefined;

   override mouseMove(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
      this.clientPosition = { x: event.clientX, y: event.clientY };
      this.diagramOffset = { x: event.offsetX, y: event.offsetY };
      return super.mouseMove(target, event);
   }
}

@injectable()
export class CrossModelCommandPalette extends GlspCommandPalette {
   protected visible = false;
   protected creationPosition?: Point;

   @inject(CrossModelMousePositionTracker) protected positionTracker: CrossModelMousePositionTracker;

   protected override onBeforeShow(containerElement: HTMLElement, root: Readonly<GModelRoot>, ...contextElementIds: string[]): void {
      if (contextElementIds.length === 1) {
         const element = root.index.getById(contextElementIds[0]);
         if (element instanceof InsertIndicator) {
            this.creationPosition = element.position;
            const bounds = getAbsoluteClientBounds(element, this.domHelper, this.viewerOptions);
            containerElement.style.left = `${bounds.x}px`;
            containerElement.style.top = `${bounds.y}px`;
            containerElement.style.width = `${this.defaultWidth}px`;
            return;
         }
      }
      const diagramOffset = this.positionTracker.diagramOffset;
      if (diagramOffset) {
         this.creationPosition = this.positionTracker.lastPositionOnDiagram;
         containerElement.style.left = `${diagramOffset.x}px`;
         containerElement.style.top = `${diagramOffset.y}px`;
         containerElement.style.width = `${this.defaultWidth}px`;
         return;
      }
      super.onBeforeShow(containerElement, root, ...contextElementIds);
   }

   protected override executeAction(input: LabeledAction | Action | Action[]): void {
      if (this.creationPosition && LabeledAction.is(input) && AddEntityOperation.is(input.actions[0])) {
         const action = input.actions[0];
         action.position = this.creationPosition;
         return super.executeAction(action);
      }
      super.executeAction(input);
   }

   override hide(): void {
      super.hide();
      this.creationPosition = undefined;
      this.visible = false;
   }
}
