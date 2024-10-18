/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { expect, Page } from '@playwright/test';
import test, { app } from '../fixtures/crossmodel-fixture';
import { CrossModelExplorerView } from '../page-objects/crossmodel-explorer-view';

let explorer: CrossModelExplorerView;

async function checkOpenWithItem(page: Page, text: string): Promise<boolean> {
   // Locate all elements matching the selector
   const elements = await page.$$('.quick-input-list .monaco-highlighted-label');

   // Iterate over elements to check for visibility and text content
   for (const element of elements) {
      if (await element.isVisible()) {
         const textContent = await element.textContent();
         if (textContent?.includes(text)) {
            return true;
         }
      }
   }
   return false;
}

test.describe('CrossModel Explorer View', () => {
   test.beforeAll(async ({ browser }) => {
      explorer = await app.openView(CrossModelExplorerView);
      await explorer.waitForVisibleFileNodes();
   });

   test('code and form editor options available in the context menu on an entity', async () => {
      const file = await explorer.getFileStatNodeByLabel('example-entity.entity.cm');
      expect(file).toBeDefined();
      expect(await file.label()).toBe('example-entity.entity.cm');
      const menu = await file.openContextMenu();
      expect(await menu.isOpen()).toBe(true);
      // Expect the Code and Form editor to be in the Open With menu option.
      await menu.clickMenuItem('Open With...');
      expect(await checkOpenWithItem(explorer.page, 'Text Editor')).toBeTruthy();
      expect(await checkOpenWithItem(explorer.page, 'Form Editor')).toBeTruthy();
      await menu.close();
   });

   test('code and form editor options available in the context menu on a relationship', async () => {
      const file = await explorer.getFileStatNodeByLabel('example-relationship.relationship.cm');
      expect(file).toBeDefined();
      expect(await file.label()).toBe('example-relationship.relationship.cm');
      const menu = await file.openContextMenu();
      expect(await menu.isOpen()).toBe(true);
      // Expect the Code and Form editor to be in the Open With menu option.
      await menu.clickMenuItem('Open With...');
      expect(await checkOpenWithItem(explorer.page, 'Text Editor')).toBeTruthy();
      expect(await checkOpenWithItem(explorer.page, 'Form Editor')).toBeTruthy();
      await menu.close();
   });

   test('code and diagram editor options available in the context menu on a diagram', async () => {
      const file = await explorer.getFileStatNodeByLabel('example-diagram.diagram.cm');
      expect(file).toBeDefined();
      expect(await file.label()).toBe('example-diagram.diagram.cm');
      const menu = await file.openContextMenu();
      expect(await menu.isOpen()).toBe(true);
      // Expect the Code and Form editor to be in the Open With menu option.
      await menu.clickMenuItem('Open With...');
      expect(await checkOpenWithItem(explorer.page, 'Text Editor')).toBeTruthy();
      expect(await checkOpenWithItem(explorer.page, 'System Diagram')).toBeTruthy();
      await menu.close();
   });
});
