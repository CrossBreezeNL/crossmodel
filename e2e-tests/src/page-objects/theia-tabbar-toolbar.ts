/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { TheiaToolbarItem, TheiaView } from '@theia/playwright';
import { TheiaViewObject } from './theia-view-object';

export class TheiaTabBarToolbar extends TheiaViewObject {
   constructor(view: TheiaView) {
      super(view, '.p-TabBar-toolbar');
   }

   async toolBarItem(commandId: string): Promise<TheiaToolbarItem | undefined> {
      const toolbarHandle = await this.objectElementHandle();
      if (!toolbarHandle) {
         return undefined;
      }
      const item = await toolbarHandle.$(this.toolBarItemSelector(commandId));
      if (item) {
         return new TheiaToolbarItem(this.app, item);
      }
      return undefined;
   }

   protected toolBarItemSelector(toolbarItemId = ''): string {
      return `div.item > div${toolbarItemId ? `[id="${toolbarItemId}"]` : ''}`;
   }
}
