/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { expect } from '@playwright/test';
import test, { app } from '../fixtures/crossmodel-fixture';
import { CrossModelExplorerView } from '../page-objects/crossmodel-explorer-view';
import { TheiaSingleInputDialog } from '../page-objects/theia-single-input-dialog';
import { TheiaTabBarToolbar } from '../page-objects/theia-tabbar-toolbar';

let explorer: CrossModelExplorerView;
let tabBarToolbar: TheiaTabBarToolbar;

test.describe('CrossModel TabBar Toolbar', () => {
    test.beforeAll(async ({ browser }) => {
        explorer = await app.openView(CrossModelExplorerView);
        await explorer.waitForVisibleFileNodes();
        tabBarToolbar = explorer.tabBarToolbar;
    });

    test.beforeEach(async () => {
        await explorer.focus();
        await tabBarToolbar.waitForVisible();
    });

    test('create new entity from tabbar toolbar', async () => {
        // Get the new-entity toolbar item.
        const tabBarToolbarNewEntity = await tabBarToolbar.toolBarItem('crossbreeze.new.entity.toolbar');
        expect(tabBarToolbarNewEntity).toBeDefined();
        if (tabBarToolbarNewEntity) {
            // expect(await tabBarToolbarNewEntity.isEnabled()).toBe(true);
            // Click on the new-entity toolbar item.
            await tabBarToolbarNewEntity.trigger();

            const newEntityDialog = new TheiaSingleInputDialog(app);
            // Wait for the New Entity dialog to popup.
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
        // Get the new-entity toolbar item.
        const tabBarToolbarNewEntity = await tabBarToolbar.toolBarItem('crossbreeze.new.relationship.toolbar');
        expect(tabBarToolbarNewEntity).toBeDefined();
        if (tabBarToolbarNewEntity) {
            // expect(await tabBarToolbarNewEntity.isEnabled()).toBe(true);
            // Click on the new-entity toolbar item.
            await tabBarToolbarNewEntity.trigger();

            const newRelationshipDialog = new TheiaSingleInputDialog(app);
            // Wait for the New Entity dialog to popup.
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
        // Get the new-entity toolbar item.
        const tabBarToolbarNewEntity = await tabBarToolbar.toolBarItem('crossbreeze.new.diagram.toolbar');
        expect(tabBarToolbarNewEntity).toBeDefined();
        if (tabBarToolbarNewEntity) {
            // expect(await tabBarToolbarNewEntity.isEnabled()).toBe(true);
            // Click on the new-entity toolbar item.
            await tabBarToolbarNewEntity.trigger();

            const newDiagramDialog = new TheiaSingleInputDialog(app);
            // Wait for the New Entity dialog to popup.
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
