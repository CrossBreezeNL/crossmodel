/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Message } from '@theia/core/lib/browser';
import { Container, injectable, interfaces } from '@theia/core/shared/inversify';
import {
   FILENAME_PANEL_CLASS,
   FILTERS_PANEL_CLASS,
   SaveFileDialog,
   SaveFileDialogProps,
   createSaveFileDialogContainer
} from '@theia/filesystem/lib/browser';

export function createCrossModelSaveFileDialogContainer(parent: interfaces.Container, props: SaveFileDialogProps): Container {
   const container = createSaveFileDialogContainer(parent, props);
   container.rebind(SaveFileDialog).to(CrossModelSaveFileDialog);
   return container;
}

@injectable()
export class CrossModelSaveFileDialog extends SaveFileDialog {
   protected override onAfterAttach(msg: Message): void {
      super.onAfterAttach(msg);
      // re-wire content so that the file name comes before the filters which is more common under Windows
      const fileNamePanel = this.contentNode.querySelector('.' + FILENAME_PANEL_CLASS);
      const filtersPanel = this.contentNode.querySelector('.' + FILTERS_PANEL_CLASS);
      if (fileNamePanel && filtersPanel) {
         this.contentNode.insertBefore(fileNamePanel, filtersPanel);
      }
   }
}
