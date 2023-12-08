/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { expect } from '@playwright/test';
import test, { app } from '../fixtures/crossmodel-fixture';
import { CrossModelExplorerView } from '../page-objects/crossmodel-explorer-view';

let explorer: CrossModelExplorerView;

test.describe('CrossModel Explorer View', () => {
   test.beforeAll(async ({ browser }) => {
      explorer = await app.openView(CrossModelExplorerView);
      await explorer.waitForVisibleFileNodes();
   });

   test('code and form editor options available in the context menu on an entity', async () => {
      const file = await explorer.getFileStatNodeByLabel('example-entity.cm');
      expect(file).toBeDefined();
      expect(await file.label()).toBe('example-entity.cm');
      const menu = await file.openContextMenu();
      expect(await menu.isOpen()).toBe(true);
      // Expect the Code and Form editor to be in the Open With menu option.
      expect(await menu.menuItemByNamePath('Open With', 'Code Editor')).toBeDefined();
      expect(await menu.menuItemByNamePath('Open With', 'Form Editor')).toBeDefined();
   });

   test('code and form editor options available in the context menu on a relationship', async () => {
      const file = await explorer.getFileStatNodeByLabel('exanple-relationship.relationship.cm');
      expect(file).toBeDefined();
      expect(await file.label()).toBe('exanple-relationship.relationship.cm');
      const menu = await file.openContextMenu();
      expect(await menu.isOpen()).toBe(true);
      // Expect the Code and Form editor to be in the Open With menu option.
      expect(await menu.menuItemByNamePath('Open With', 'Code Editor')).toBeDefined();
      expect(await menu.menuItemByNamePath('Open With', 'Form Editor')).toBeDefined();
   });

   test('code and diagram editor options available in the context menu on a diagram', async () => {
      const file = await explorer.getFileStatNodeByLabel('example-diagram.diagram.cm');
      expect(file).toBeDefined();
      expect(await file.label()).toBe('example-diagram.diagram.cm');
      const menu = await file.openContextMenu();
      expect(await menu.isOpen()).toBe(true);
      // Expect the Code and Form editor to be in the Open With menu option.
      expect(await menu.menuItemByNamePath('Open With', 'Code Editor')).toBeDefined();
      expect(await menu.menuItemByNamePath('Open With', 'CrossModel Diagram')).toBeDefined();
   });
});
