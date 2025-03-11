/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { expect, test } from '@playwright/test';
import { TheiaTextEditor } from '@theia/playwright';
import { CMApp } from '../../page-objects/cm-app';
import { CMNewModelInputDialog } from '../../page-objects/cm-new-model-dialog';

async function confirmCreationDialog(app: CMApp, entityName: string, modelType: string, version: string): Promise<void> {
   const newModelDIalog = new CMNewModelInputDialog(app);
   newModelDIalog.waitForVisible();
   expect(await newModelDIalog.title()).toBe('New Data Model...');
   await newModelDIalog.enterName(entityName);
   await newModelDIalog.enterVersion(version);
   await newModelDIalog.selectType(modelType);
   await newModelDIalog.waitUntilMainButtonIsEnabled();
   await newModelDIalog.confirm();
   await newModelDIalog.waitForClosed();
}

test.describe.only('Add/Edit/Delete model from explorer', () => {
   let app: CMApp;
   const NEW_MODEL_PATH = 'testFolder/NewModel';
   const NEW_MODEL_PACKAGE_PATH = 'testFolder/NewModel/package.json';
   const NEW_MODEL2_PATH = 'testFolder/NewModel2';
   test.beforeAll(async ({ browser, playwright }) => {
      app = await CMApp.load({ browser, playwright });
   });
   test.afterAll(async () => {
      await app.page.close();
   });

   test('Create model via explorer tabbar', async () => {
      const explorer = await app.openExplorerView();
      await explorer.getFileStatNodeByLabel('testFolder');
      await explorer.selectTreeNode('testFolder');

      const tabBarToolbarNewModel = await explorer.tabBarToolbar.toolBarItem('crossbreeze.new.data-model.toolbar');
      expect(tabBarToolbarNewModel).toBeDefined();
      if (!tabBarToolbarNewModel) {
         return;
      }
      const name = 'NewModel';
      const modeltype = 'logical';
      const version = '0.0.1';
      await tabBarToolbarNewModel.trigger();
      await confirmCreationDialog(app, 'NewModel', 'logical', '0.0.1');

      // Verify that the model was created as expected
      await explorer.activate();
      expect(await explorer.existsDirectoryNode(NEW_MODEL_PATH)).toBeTruthy();

      // Verify the model file contents is as expected.
      const editor = await app.openEditor(NEW_MODEL_PACKAGE_PATH, TheiaTextEditor);
      expect((await editor.textContentOfLineByLineNumber(2))?.trim()).toBe(`"name": "${name}",`);
      expect((await editor.textContentOfLineByLineNumber(3))?.trim()).toBe(`"version": "${version}",`);
      expect((await editor.textContentOfLineByLineNumber(4))?.trim()).toBe(`"type": "${modeltype}",`);
      expect((await editor.textContentOfLineByLineNumber(5))?.trim()).toBe('"dependencies": {}');
      await editor.saveAndClose();
      await explorer.activate();
      await explorer.selectTreeNode(NEW_MODEL_PATH);
      const expectedTabbarToolbarItems = await Promise.all([
         explorer.tabBarToolbar.toolBarItem('crossbreeze.new.entity.toolbar'),
         explorer.tabBarToolbar.toolBarItem('crossbreeze.new.relationship.toolbar'),
         explorer.tabBarToolbar.toolBarItem('crossbreeze.new.system-diagram.toolbar'),
         explorer.tabBarToolbar.toolBarItem('crossbreeze.new.mapping.toolbar')
      ]);
      expectedTabbarToolbarItems.forEach(item => expect(item).toBeDefined());
      const node = await explorer.getFileStatNodeByLabel(NEW_MODEL_PATH);
      const menu = await node.openContextMenu();
      const expectedContextMenuItems = await Promise.all([
         menu.menuItemByNamePath('New Element', 'Entity...'),
         menu.menuItemByNamePath('New Element', 'Relationship...'),
         menu.menuItemByNamePath('New Element', 'System Diagram...'),
         menu.menuItemByNamePath('New Element', 'Mapping...')
      ]);
      expectedContextMenuItems.forEach(item => expect(item).toBeDefined());
   });

   test('Create model via context menu', async () => {
      const explorer = await app.openExplorerView();
      // Create node
      const folderNode = await explorer.getFileStatNodeByLabel('testFolder');
      const contextMenu = await folderNode.openContextMenu();
      const menuItem = await contextMenu.menuItemByNamePath('New Element', 'Data Model...');
      expect(menuItem).toBeDefined();
      await menuItem?.click();
      await confirmCreationDialog(app, 'NewModel2', 'physical', '0.0.2');
      await explorer.activate();

      // Verify that the model was created as expected
      expect(await explorer.existsDirectoryNode(NEW_MODEL2_PATH)).toBeTruthy();

      await explorer.selectTreeNode(NEW_MODEL2_PATH);
      const unexpectedTabbarToolbarItems = await Promise.all([
         explorer.tabBarToolbar.toolBarItem('crossbreeze.new.entity.toolbar'),
         explorer.tabBarToolbar.toolBarItem('crossbreeze.new.relationship.toolbar'),
         explorer.tabBarToolbar.toolBarItem('crossbreeze.new.system-diagram.toolbar'),
         explorer.tabBarToolbar.toolBarItem('crossbreeze.new.mapping.toolbar')
      ]);
      unexpectedTabbarToolbarItems.forEach(item => expect(item).toBeUndefined());
      const node = await explorer.getFileStatNodeByLabel(NEW_MODEL2_PATH);
      const menu = await node.openContextMenu();
      const unexpectedContextMenuItems = await Promise.allSettled([
         menu.menuItemByNamePath('New Element', 'Entity...'),
         menu.menuItemByNamePath('New Element', 'Relationship...'),
         menu.menuItemByNamePath('New Element', 'System Diagram...'),
         menu.menuItemByNamePath('New Element', 'Mapping...')
      ]);
      unexpectedContextMenuItems.forEach(item => expect(item.status).toBe('rejected'));
   });
});
