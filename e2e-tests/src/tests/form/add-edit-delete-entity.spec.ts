/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { expect, test } from '@playwright/test';
import { CMApp } from '../../page-objects/cm-app';
import { CMCompositeEditor } from '../../page-objects/cm-composite-editor';

async function confirmCreationEditor(app: CMApp, parentPathFragment: string, entityName: string, description?: string): Promise<void> {
   const untitledEditor = new CMCompositeEditor(parentPathFragment + '/NewLogicalEntity.entity.cm', app, 'untitled');
   await untitledEditor.waitForVisible();
   const formEditor = await untitledEditor.switchToFormEditor();
   const form = (await formEditor.formFor('entity')).generalSection;
   await form.setName(entityName);
   if (description) {
      await form.setDescription(description);
   }
   formEditor.waitForDirty();
   formEditor.saveAndClose();
}

test.describe('Add/Edit/Delete entity from explorer', () => {
   let app: CMApp;
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
      await confirmCreationEditor(app, 'ExampleCRM/entities', 'Spaced Name', 'Also tests our ID normalization');

      // Verify that the entity was created as expected
      explorer.activate();
      expect(await explorer.existsFileNode('ExampleCRM/entities/Spaced_Name.entity.cm')).toBeTruthy();

      // Verify the entity file contents is as expected.
      const savedEditor = await app.openCompositeEditor('ExampleCRM/entities/Spaced_Name.entity.cm', 'Code Editor');
      expect(await savedEditor.textContentOfLineByLineNumber(1)).toBe('entity:');
      expect(await savedEditor.textContentOfLineByLineNumber(2)).toMatch('id: Spaced_Name');
      expect(await savedEditor.textContentOfLineByLineNumber(3)).toMatch('name: "Spaced Name"');
      expect(await savedEditor.textContentOfLineByLineNumber(4)).toMatch('description: "Also tests our ID normalization"');
      await savedEditor.saveAndClose();
   });

   test('Edit entity name & description using form editor', async () => {
      const formEditor = await app.openCompositeEditor('ExampleCRM/entities/Spaced_Name.entity.cm', 'Form Editor');
      const form = await formEditor.formFor('entity');
      const general = form.generalSection;
      await general.setName('NewEntityRenamed');
      await general.setDescription('NewEntityDescription');
      await formEditor.waitForDirty();
      await formEditor.saveAndClose();

      // Verify that the entity file was changed as expected
      const editor = await app.openCompositeEditor('ExampleCRM/entities/Spaced_Name.entity.cm', 'Code Editor');
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
      await confirmCreationEditor(app, 'ExampleCRM/entities', 'NewEntity2');
      explorer.activate();

      // Verify that the entity was created as expected
      expect(await explorer.existsFileNode(NEW_ENTITY2_PATH)).toBeTruthy();

      // Delete node
      await explorer.deleteNode(NEW_ENTITY2_PATH);
      expect(await explorer.findTreeNode(NEW_ENTITY2_PATH)).toBeUndefined();
   });
});
