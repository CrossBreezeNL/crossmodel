/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { test, expect, Page } from '@playwright/test';
import { CrossModelApp } from '../page-objects/crossmodel-app';
import { CrossModelWorkspace } from '../page-objects/crossmodel-workspace';
import { CrossModelExplorerView } from '../page-objects/crossmodel-explorer-view';

let page: Page;
let app: CrossModelApp;
let explorer: CrossModelExplorerView;

test.describe('CrossModel Explorer View', () => {
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        const ws = new CrossModelWorkspace(['src/resources/sample-workspace']);
        app = await CrossModelApp.load(page, ws);
        explorer = await app.openView(CrossModelExplorerView);
        await explorer.waitForVisibleFileNodes();
    });

    test('code and form editor options should be available in the context menu on an entity', async () => {
        // NOTE: It seems if we don't set compact here to true, it doesn't pickup the right file node.
        const file = await explorer.getFileStatNodeByLabel('example-entity.cm', true);
        expect(await file.label()).toBe('example-entity.cm');
        const menu = await file.openContextMenu();
        expect(await menu.isOpen()).toBe(true);
        // Expect the Code and Form editor to be in the Open With menu option.
        expect(await menu.menuItemByNamePath('Open With', 'Code Editor')).toBeDefined();
        expect(await menu.menuItemByNamePath('Open With', 'Form Editor')).toBeDefined();
    });

    // class for tabBar toolbar: p-TabBar-toolbar
    test('create new entity from tabbar toolbar', async () => {
        const toolbarTabbar = await explorer.toolbarTabbar();
        expect(await toolbarTabbar.isDisplayed()).toBe(true);
    });
});
