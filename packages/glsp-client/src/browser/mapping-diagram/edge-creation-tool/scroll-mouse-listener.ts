/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Action, GLSPScrollMouseListener, GModelElement, GNode, findParent } from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';

// Custom mouse listener that prevents scrolling when the mouse is over a node
@injectable()
export class NoScrollOverNodeListener extends GLSPScrollMouseListener {
   override mouseDown(target: GModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
      if (this.preventScrolling) {
         return [];
      }

      const node = findParent(target, element => element instanceof GNode);
      if (node) {
         return [];
      }
      return super.mouseDown(target, event);
   }
}
