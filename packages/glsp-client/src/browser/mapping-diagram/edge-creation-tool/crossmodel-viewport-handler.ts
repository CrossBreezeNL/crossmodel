/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { Action } from '@eclipse-glsp/client';
import { RestoreViewportHandler } from '@eclipse-glsp/client/lib/features/viewport/viewport-handler';
import { injectable } from '@theia/core/shared/inversify';
import { ExtendedEnableDefaultToolsAction } from './actions';

@injectable()
export class CrossModelRestoreViewportHandler extends RestoreViewportHandler {
   override handle(action: Action): void | Action {
      if (ExtendedEnableDefaultToolsAction.is(action) && !action.focusGraph) {
         return;
      }
      return super.handle(action);
   }
}
