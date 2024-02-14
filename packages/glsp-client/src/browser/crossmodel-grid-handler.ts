/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { GRID } from '@crossbreeze/protocol';
import { IActionHandler, Point, SetViewportAction, TYPES, ViewerOptions } from '@eclipse-glsp/client';
import { inject, injectable } from '@theia/core/shared/inversify';

@injectable()
export class GridAlignmentHandler implements IActionHandler {
   @inject(TYPES.ViewerOptions) protected options: ViewerOptions;

   handle(action: SetViewportAction): void {
      const graphDiv = document.querySelector<HTMLElement>(`#${this.options.baseDiv} .sprotty-graph`);
      if (graphDiv) {
         const adaptedPosition = multiply(Point.subtract(GRID, action.newViewport.scroll), action.newViewport.zoom);
         const adaptedSize = multiply(GRID, action.newViewport.zoom);

         graphDiv.style.backgroundPosition = `${adaptedPosition.x}px ${adaptedPosition.y}px`;
         graphDiv.style.backgroundSize = `${adaptedSize.x}px ${adaptedSize.y}px`;
      }
   }
}

function multiply(point: Point, factor: number): Point {
   return { x: point.x * factor, y: point.y * factor };
}
