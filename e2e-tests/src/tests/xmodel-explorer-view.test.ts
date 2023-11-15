/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { test, expect, Page } from '@playwright/test';
import { CrossModelApp } from '../page-objects/crossmodel-app';
import { CrossModelWorkspace } from '../page-objects/crossmodel-workspace';
import { TheiaExplorerView } from '@theia/playwright';

let page: Page;
let app: CrossModelApp;
let explorer: TheiaExplorerView;

test.describe('CrossModel Explorer View', () => {
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        const ws = new CrossModelWorkspace(['src/resources/sample-workspace']);
        app = await CrossModelApp.load(page, ws);
        explorer = await app.openView(TheiaExplorerView);
        await explorer.waitForVisibleFileNodes();
    });

    test('should open context menu on "example-entity.cm"', async () => {
        const file = await explorer.getFileStatNodeByLabel('example-entity.cm');
        const menu = await file.openContextMenu();
        expect(await menu.isOpen()).toBe(true);

        const menuItems = await menu.visibleMenuItems();
        expect(menuItems).toContain('Open With...');
    });
});
