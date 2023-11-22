/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { test, expect, Page } from '@playwright/test';
import { CrossModelApp } from '../page-objects/crossmodel-app';
import { CrossModelWorkspace } from '../page-objects/crossmodel-workspace';
import { CrossModelExplorerView } from '../page-objects/crossmodel-explorer-view';
import { TheiaSingleInputDialog } from '../page-objects/theia-single-input-dialog';

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
        const file = await explorer.getFileStatNodeByLabel('example-entity.cm');
        expect(file).toBeDefined();
        expect(await file.label()).toBe('example-entity.cm');
        const menu = await file.openContextMenu();
        expect(await menu.isOpen()).toBe(true);
        // Expect the Code and Form editor to be in the Open With menu option.
        expect(await menu.menuItemByNamePath('Open With', 'Code Editor')).toBeDefined();
        expect(await menu.menuItemByNamePath('Open With', 'Form Editor')).toBeDefined();
    });

    test('create new entity from tabbar toolbar', async () => {
        const tabBarToolbar = await explorer.tabBarToolbar();
        // Hover over the tabbar toolbar to make it visible.
        await tabBarToolbar.hover();
        // Check the Tab bar toolbar is visible.
        expect(await tabBarToolbar.isVisible()).toBe(true);
        // Get the new-entity toolbar item.
        const tabBarToolbarNewEntity = await tabBarToolbar.toolBarItem('crossbreeze.new.entity.toolbar');
        expect(tabBarToolbarNewEntity).toBeDefined();
        if (tabBarToolbarNewEntity) {
            // expect(await tabBarToolbarNewEntity.isEnabled()).toBe(true);
            // Click on the new-entity toolbar item.
            await tabBarToolbarNewEntity.trigger();

            const newEntityDialog = new TheiaSingleInputDialog(app);
            // Wait for the New Entity dailog to popup.
            newEntityDialog.waitForVisible();
            // Check the title of the dialog.
            expect(await newEntityDialog.title()).toBe('New Entity...');
            // Set the name for the new entity.
            await newEntityDialog.enterSingleInput('entity-created-from-tabbar-toolbar');
            // Wait until we can click the main button.
            await newEntityDialog.waitUntilMainButtonIsEnabled();
            // Confirm the dialog.
            await newEntityDialog.confirm();
            // Wait until the dialog is closed.
            await newEntityDialog.waitForClosed();

            explorer = await app.openView(CrossModelExplorerView);
            const file = await explorer.getFileStatNodeByLabel('entity-created-from-tabbar-toolbar.entity.cm');
            expect(file).toBeDefined();
            expect(await file.label()).toBe('entity-created-from-tabbar-toolbar.entity.cm');
        }
    });

    test('create new relationship from tabbar toolbar', async () => {
        const tabBarToolbar = await explorer.tabBarToolbar();
        // Hover over the tabbar toolbar to make it visible.
        await tabBarToolbar.hover();
        // Check the Tab bar toolbar is visible.
        expect(await tabBarToolbar.isVisible()).toBe(true);
        // Get the new-entity toolbar item.
        const tabBarToolbarNewEntity = await tabBarToolbar.toolBarItem('crossbreeze.new.relationship.toolbar');
        expect(tabBarToolbarNewEntity).toBeDefined();
        if (tabBarToolbarNewEntity) {
            // expect(await tabBarToolbarNewEntity.isEnabled()).toBe(true);
            // Click on the new-entity toolbar item.
            await tabBarToolbarNewEntity.trigger();

            const newRelationshipDialog = new TheiaSingleInputDialog(app);
            // Wait for the New Entity dailog to popup.
            newRelationshipDialog.waitForVisible();
            // Check the title of the dialog.
            expect(await newRelationshipDialog.title()).toBe('New Relationship...');
            // Set the name for the new entity.
            await newRelationshipDialog.enterSingleInput('relationship-created-from-tabbar-toolbar');
            // Wait until we can click the main button.
            await newRelationshipDialog.waitUntilMainButtonIsEnabled();
            // Confirm the dialog.
            await newRelationshipDialog.confirm();
            // Wait until the dialog is closed.
            await newRelationshipDialog.waitForClosed();

            explorer = await app.openView(CrossModelExplorerView);
            const file = await explorer.getFileStatNodeByLabel('relationship-created-from-tabbar-toolbar.relationship.cm');
            expect(file).toBeDefined();
            expect(await file.label()).toBe('relationship-created-from-tabbar-toolbar.relationship.cm');
        }
    });

    test('create new diagram from tabbar toolbar', async () => {
        const tabBarToolbar = await explorer.tabBarToolbar();
        // Hover over the tabbar toolbar to make it visible.
        await tabBarToolbar.hover();
        // Check the Tab bar toolbar is visible.
        expect(await tabBarToolbar.isVisible()).toBe(true);
        // Get the new-entity toolbar item.
        const tabBarToolbarNewEntity = await tabBarToolbar.toolBarItem('crossbreeze.new.diagram.toolbar');
        expect(tabBarToolbarNewEntity).toBeDefined();
        if (tabBarToolbarNewEntity) {
            // expect(await tabBarToolbarNewEntity.isEnabled()).toBe(true);
            // Click on the new-entity toolbar item.
            await tabBarToolbarNewEntity.trigger();

            const newDiagramDialog = new TheiaSingleInputDialog(app);
            // Wait for the New Entity dailog to popup.
            newDiagramDialog.waitForVisible();
            // Check the title of the dialog.
            expect(await newDiagramDialog.title()).toBe('New Diagram...');
            // Set the name for the new entity.
            await newDiagramDialog.enterSingleInput('diagram-created-from-tabbar-toolbar');
            // Wait until we can click the main button.
            await newDiagramDialog.waitUntilMainButtonIsEnabled();
            // Confirm the dialog.
            await newDiagramDialog.confirm();
            // Wait until the dialog is closed.
            await newDiagramDialog.waitForClosed();

            explorer = await app.openView(CrossModelExplorerView);
            const file = await explorer.getFileStatNodeByLabel('diagram-created-from-tabbar-toolbar.diagram.cm');
            expect(file).toBeDefined();
            expect(await file.label()).toBe('diagram-created-from-tabbar-toolbar.diagram.cm');
        }
    });
});
