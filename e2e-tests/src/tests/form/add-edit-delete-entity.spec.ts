/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { expect, test } from '@playwright/test';
import { CMApp } from '../../page-objects/cm-app';
import { TheiaSingleInputDialog } from '../../page-objects/theia-single-input-dialog';

async function confirmCreationDialog(app: CMApp, entityName: string): Promise<void> {
   const newEntityDialog = new TheiaSingleInputDialog(app);
   newEntityDialog.waitForVisible();
   expect(await newEntityDialog.title()).toBe('New Entity...');
   await newEntityDialog.enterSingleInput(entityName);
   await newEntityDialog.waitUntilMainButtonIsEnabled();
   await newEntityDialog.confirm();
   await newEntityDialog.waitForClosed();
}

test.describe('Add/Edit/Delete entity from explorer', () => {
   let app: CMApp;
   const NEW_ENTITY_PATH = 'ExampleCRM/entities/NewEntity.entity.cm';
   const NEW_ENTITY2_PATH = 'ExampleCRM/entities/NewEntity2.entity.cm';
   test.beforeAll(async ({ browser, playwright }) => {
      app = await CMApp.load({ browser, playwright });
   });
   test.afterAll(async () => {
      await app.page.close();
   });

   test('Create entity via explorer tabbar', async () => {
      const explorer = await app.openExplorerView();
      await explorer.getFileStatNodeByLabel('ExampleCRM/entities');
      await explorer.selectTreeNode('ExampleCRM/entities');

      const tabBarToolbarNewEntity = await explorer.tabBarToolbar.toolBarItem('crossbreeze.new.entity.toolbar');
      expect(tabBarToolbarNewEntity).toBeDefined();
      if (!tabBarToolbarNewEntity) {
         return;
      }
      await tabBarToolbarNewEntity.trigger();
      await confirmCreationDialog(app, 'NewEntity');

      // Verify that the entity was created as expected
      explorer.activate();
      expect(await explorer.existsFileNode(NEW_ENTITY_PATH)).toBeTruthy();

      // Verify the entity file contents is as expected.
      const editor = await app.openCompositeEditor(NEW_ENTITY_PATH, 'Code Editor');
      expect(await editor.textContentOfLineByLineNumber(1)).toBe('entity:');
      expect(await editor.textContentOfLineByLineNumber(2)).toMatch('id: NewEntity');
      expect(await editor.textContentOfLineByLineNumber(3)).toMatch('name: "NewEntity"');
      await editor.saveAndClose();
   });

   test('Edit entity name & description using form editor', async () => {
      const formEditor = await app.openCompositeEditor(NEW_ENTITY_PATH, 'Form Editor');
      const form = await formEditor.formFor('entity');
      const general = await form.generalSection;
      await general.setName('NewEntityRenamed');
      await general.setDescription('NewEntityDescription');
      await formEditor.waitForDirty();
      await formEditor.saveAndClose();

      // Verify that the entity file was changed as expected
      const editor = await app.openCompositeEditor(NEW_ENTITY_PATH, 'Code Editor');
      expect(await editor.textContentOfLineByLineNumber(3)).toMatch('name: "NewEntityRenamed"');
      expect(await editor.textContentOfLineByLineNumber(4)).toMatch('description: "NewEntityDescription"');
      await editor.saveAndClose();
   });

   test('Create & delete entity via context menu', async () => {
      const explorer = await app.openExplorerView();
      // Create node
      const folderNode = await explorer.getFileStatNodeByLabel('ExampleCRM/entities');
      const contextMenu = await folderNode.openContextMenu();
      const menuItem = await contextMenu.menuItemByNamePath('New Element', 'Entity...');
      expect(menuItem).toBeDefined();
      await menuItem?.click();
      await confirmCreationDialog(app, 'NewEntity2');
      explorer.activate();

      // Verify that the entity was created as expected
      expect(await explorer.existsFileNode(NEW_ENTITY2_PATH)).toBeTruthy();

      // Delete node
      await explorer.deleteNode(NEW_ENTITY2_PATH);
      expect(await explorer.findTreeNode(NEW_ENTITY2_PATH)).toBeUndefined();
   });
});
