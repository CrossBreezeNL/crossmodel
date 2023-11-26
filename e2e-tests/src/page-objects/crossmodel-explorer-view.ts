/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { TheiaApp, TheiaExplorerView } from '@theia/playwright';
import { TheiaTabBarToolbar } from './theia-tabbar-toolbar';

export class CrossModelExplorerView extends TheiaExplorerView {
   public readonly tabBarToolbar: TheiaTabBarToolbar;

   constructor(app: TheiaApp) {
      super(app);
      this.tabBarToolbar = new TheiaTabBarToolbar(this);
   }
}
