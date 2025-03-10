/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { expect, test } from '@playwright/test';
import { CMApp } from '../page-objects/cm-app';
import { CMExplorerView } from '../page-objects/cm-explorer-view';
import { TheiaSingleInputDialog } from '../page-objects/theia-single-input-dialog';
import { OSUtil } from '@theia/playwright';

test.describe('CrossModel TabBar Toolbar', () => {
   let app: CMApp;
   let explorer: CMExplorerView;

   test.beforeAll(async ({ browser, playwright }) => {
      app = await CMApp.load({ browser, playwright });
      explorer = await app.openExplorerView();
   });
   test.beforeEach(async () => {
      await explorer.focus();
      await explorer.tabBarToolbar.waitForVisible();
   });

   test('create new entity from tabbar toolbar', async () => {
      // A data model of the appropriate type must be selected for the commands to be visible.
      await explorer.selectTreeNode('ExampleCRM');
      // Get the new-entity toolbar item.
      const tabBarToolbarNewEntity = await explorer.tabBarToolbar.toolBarItem('crossbreeze.new.entity.toolbar');
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

         explorer = await app.openView(CMExplorerView);
         const file = await explorer.fileStatNode('ExampleCRM' + OSUtil.fileSeparator + 'entity-created-from-tabbar-toolbar.entity.cm');
         expect(file).toBeDefined();
         expect(await file!.label()).toBe('entity-created-from-tabbar-toolbar.entity.cm');
      }
   });

   test('create new relationship from tabbar toolbar', async () => {
      // A data model of the appropriate type must be selected for the commands to be visible.
      await explorer.selectTreeNode('ExampleCRM');
      // Get the new-entity toolbar item.
      const tabBarToolbarNewEntity = await explorer.tabBarToolbar.toolBarItem('crossbreeze.new.relationship.toolbar');
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

         explorer = await app.openView(CMExplorerView);
         const file = await explorer.fileStatNode(
            'ExampleCRM' + OSUtil.fileSeparator + 'relationship-created-from-tabbar-toolbar.relationship.cm'
         );
         expect(file).toBeDefined();
         expect(await file!.label()).toBe('relationship-created-from-tabbar-toolbar.relationship.cm');
      }
   });

   test('create new diagram from tabbar toolbar', async () => {
      // A data model of the appropriate type must be selected for the commands to be visible.
      await explorer.selectTreeNode('ExampleCRM');
      // Get the new-entity toolbar item.
      const tabBarToolbarNewEntity = await explorer.tabBarToolbar.toolBarItem('crossbreeze.new.system-diagram.toolbar');
      expect(tabBarToolbarNewEntity).toBeDefined();
      if (tabBarToolbarNewEntity) {
         // expect(await tabBarToolbarNewEntity.isEnabled()).toBe(true);
         // Click on the new-entity toolbar item.
         await tabBarToolbarNewEntity.trigger();

         const newDiagramDialog = new TheiaSingleInputDialog(app);
         // Wait for the New Entity dialog to popup.
         newDiagramDialog.waitForVisible();
         // Check the title of the dialog.
         expect(await newDiagramDialog.title()).toBe('New System Diagram...');
         // Set the name for the new entity.
         await newDiagramDialog.enterSingleInput('diagram-created-from-tabbar-toolbar');
         // Wait until we can click the main button.
         await newDiagramDialog.waitUntilMainButtonIsEnabled();
         // Confirm the dialog.
         await newDiagramDialog.confirm();
         // Wait until the dialog is closed.
         await newDiagramDialog.waitForClosed();

         explorer = await app.openView(CMExplorerView);
         const file = await explorer.fileStatNode(
            'ExampleCRM' + OSUtil.fileSeparator + 'diagram-created-from-tabbar-toolbar.system-diagram.cm'
         );
         expect(file).toBeDefined();
         expect(await file!.label()).toBe('diagram-created-from-tabbar-toolbar.system-diagram.cm');
      }
   });
});
