/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { TheiaExplorerView } from '@theia/playwright';
import { TheiaTabBarToolbar } from './theia-tabbar-toolbar';

export class CrossModelExplorerView extends TheiaExplorerView {
    async tabBarToolbar(): Promise<TheiaTabBarToolbar> {
        return new TheiaTabBarToolbar(this);
    }
}
