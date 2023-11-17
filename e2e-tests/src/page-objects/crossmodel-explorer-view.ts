/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { TheiaExplorerView } from '@theia/playwright';
import { TheiaTabbarToolbar } from './theia-tabbar-toolbar';

export class CrossModelExplorerView extends TheiaExplorerView {
    async toolbarTabbar(): Promise<TheiaTabbarToolbar> {
        return new TheiaTabbarToolbar(this);
    }
}
