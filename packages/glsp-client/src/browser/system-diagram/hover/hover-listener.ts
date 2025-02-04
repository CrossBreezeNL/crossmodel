/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { Action, FocusStateChangedAction, GlspHoverMouseListener, HoverFeedbackAction, ICommand } from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class SystemHoverListener extends GlspHoverMouseListener {
   // Override handle method to prevent deactivation of hover feedback when the edge edit tool is enabled
   override handle(action: Action): void | Action | ICommand {
      if (FocusStateChangedAction.is(action) && !action.hasFocus) {
         this.stopMouseOverTimer();
         if (this.lastHoverFeedbackElementId) {
            const previousTargetId = this.lastHoverFeedbackElementId;
            this.lastHoverFeedbackElementId = undefined;
            return HoverFeedbackAction.create({ mouseoverElement: previousTargetId, mouseIsOver: false });
         }
      }
   }
}
