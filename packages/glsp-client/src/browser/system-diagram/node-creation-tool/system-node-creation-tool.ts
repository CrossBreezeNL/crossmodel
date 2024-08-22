/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   Action,
   Disposable,
   DisposableCollection,
   GModelElement,
   GhostElement,
   NodeCreationTool,
   NodeCreationToolMouseListener,
   SetUIExtensionVisibilityAction,
   TrackedInsert
} from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';
import { CrossModelCommandPalette } from '../../cross-model-command-palette';

@injectable()
export class SystemNodeCreationTool extends NodeCreationTool {
   protected override createNodeCreationListener(ghostElement: GhostElement): Disposable {
      const toolListener = new SystemNodeCreationToolMouseListener(this.triggerAction, this, ghostElement);
      return new DisposableCollection(toolListener, this.mouseTool.registerListener(toolListener));
   }
}

export class SystemNodeCreationToolMouseListener extends NodeCreationToolMouseListener {
   protected override isContinuousMode(_ctx: GModelElement, _event: MouseEvent): boolean {
      return true;
   }

   protected override getCreateOperation(ctx: GModelElement, event: MouseEvent, insert: TrackedInsert): Action {
      if (this.triggerAction.args?.type === 'show') {
         return SetUIExtensionVisibilityAction.create({
            extensionId: CrossModelCommandPalette.ID,
            visible: true,
            contextElementsId: [this.ghostElementId]
         });
      } else if (this.triggerAction.args?.type === 'create') {
         return super.getCreateOperation(ctx, event, insert);
      }
      throw new Error('Invalid node creation type');
   }
}
