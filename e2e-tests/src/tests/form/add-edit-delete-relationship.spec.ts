/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { expect, test } from '@playwright/test';
import { CMApp } from '../../page-objects/cm-app';
import { TheiaSingleInputDialog } from '../../page-objects/theia-single-input-dialog';

async function confirmCreationDialog(app: CMApp, relationshipName: string): Promise<void> {
   const dialog = new TheiaSingleInputDialog(app);
   dialog.waitForVisible();
   expect(await dialog.title()).toBe('New Relationship...');
   await dialog.enterSingleInput(relationshipName);
   await dialog.waitUntilMainButtonIsEnabled();
   await dialog.confirm();
   await dialog.waitForClosed();
}

test.describe('Add/Edit/Delete relationship from explorer', () => {
   let app: CMApp;
   const NEW_RELATIONSHIP_PATH = 'ExampleCRM/relationships/NewRelationship.relationship.cm';
   const TEST_RELATIONSHIP_PATH = 'ExampleCRM/relationships/Test.relationship.cm';
   test.beforeAll(async ({ browser, playwright }) => {
      app = await CMApp.load({ browser, playwright });
   });
   test.afterAll(async () => {
      await app.page.close();
   });

   test('Create relationship via explorer tabbar', async () => {
      const explorer = await app.openExplorerView();
      await explorer.getFileStatNodeByLabel('ExampleCRM/relationships');
      await explorer.selectTreeNode('ExampleCRM/relationships');

      const tabBarToolbarNewRelationship = await explorer.tabBarToolbar.toolBarItem('crossbreeze.new.relationship.toolbar');
      expect(tabBarToolbarNewRelationship).toBeDefined();
      if (!tabBarToolbarNewRelationship) {
         return;
      }
      await tabBarToolbarNewRelationship.trigger();
      await confirmCreationDialog(app, 'NewRelationship');

      // Verify that the relationship was created as expected
      explorer.activate();
      expect(await explorer.existsFileNode(NEW_RELATIONSHIP_PATH)).toBeTruthy();

      const editor = await app.openCompositeEditor(NEW_RELATIONSHIP_PATH, 'Code Editor');
      expect(await editor.textContentOfLineByLineNumber(1)).toBe('relationship:');
      expect(await editor.textContentOfLineByLineNumber(2)).toMatch('id: NewRelationship');
      expect(await editor.textContentOfLineByLineNumber(3)).toMatch('name: "NewRelationship"');
      expect(await editor.textContentOfLineByLineNumber(4)).toMatch('parent: Address');
      expect(await editor.textContentOfLineByLineNumber(5)).toMatch('child: Customer');
      await editor.close();
   });

   test('Edit relationship name & description using form editor ', async () => {
      // Workaround: New relationship created in the previous test is incomplete, so we use an existing one instead
      const formEditor = await app.openCompositeEditor(TEST_RELATIONSHIP_PATH, 'Form Editor');
      const form = await formEditor.formFor('relationship');
      const general = await form.generalSection;
      await general.setName('NewRelationshipRenamed');
      await general.setDescription('NewRelationshipRenamed');
      await formEditor.waitForDirty();
      await formEditor.saveAndClose();

      // Verify that the relationship file was changed as expected
      const editor = await app.openCompositeEditor(TEST_RELATIONSHIP_PATH, 'Code Editor');
      expect(await editor.textContentOfLineByLineNumber(3)).toMatch('name: "NewRelationshipRenamed"');
      expect(await editor.textContentOfLineByLineNumber(4)).toMatch('description: "NewRelationshipRenamed"');
      await editor.saveAndClose();
   });

   test('Delete relationship via context menu', async () => {
      const explorer = await app.openExplorerView();
      await explorer.deleteNode(NEW_RELATIONSHIP_PATH);
      expect(await explorer.findTreeNode(NEW_RELATIONSHIP_PATH)).toBeUndefined();
   });
});
