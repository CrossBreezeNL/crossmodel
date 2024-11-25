/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { expect } from '@eclipse-glsp/glsp-playwright';
import { test } from '@playwright/test';
import { CMApp } from '../../../page-objects/cm-app';
import { Entity } from '../../../page-objects/system-diagram/diagram-elements';

test.describe.serial('Add/Edit/Delete entity in a diagram ', () => {
   let app: CMApp;
   const SYSTEM_DIAGRAM_PATH = 'ExampleCRM/diagrams/EMPTY.system-diagram.cm';
   const NEW_ENTITY_PATH = 'ExampleCRM/entities/NewEntity.entity.cm';
   const NEW_ENTITY_LABEL = 'NewEntity';
   const RENAMED_ENTITY_LABEL = 'NewEntityRenamed';
   const RENAMED_ENTITY_DESCRIPTION = 'NewEntityDescription';

   test.beforeAll(async ({ browser, playwright }) => {
      app = await CMApp.load({ browser, playwright });
   });
   test.afterAll(async () => {
      await app.page.close();
   });

   test('create new entity via toolbox', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      // Create new entity
      await diagramEditor.waitForCreationOfType(Entity, async () => {
         const existingEntity = await diagramEditor.getEntity('EmptyEntity');
         await diagramEditor.enableTool('Create Entity');
         const taskBounds = await existingEntity.bounds();
         await taskBounds.position('top_center').moveRelative(0, -100).click();
      });

      // Verify that the entity node was created as expected in the diagram
      const newEntity = await diagramEditor.getEntity(NEW_ENTITY_LABEL);
      expect(newEntity).toBeDefined();

      const diagramCodeEditor = await diagramEditor.parent.switchToCodeEditor();
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(12)).toMatch('- id: NewEntityNode');
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(13)).toMatch(`entity: ${NEW_ENTITY_LABEL}`);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(14)).toMatch(/x:\s*\d+/);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(15)).toMatch(/y:\s*\d+/);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(16)).toMatch(/width:\s*\d+/);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(17)).toMatch(/height:\s*\d+/);
      await diagramCodeEditor.saveAndClose();

      // Verify that the entity  was created as expected
      const explorer = await app.openExplorerView();
      expect(await explorer.existsFileNode(NEW_ENTITY_PATH)).toBeTruthy();

      const entityCodeEditor = await app.openCompositeEditor(NEW_ENTITY_PATH, 'Code Editor');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(1)).toBe('entity:');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(2)).toMatch(`id: ${NEW_ENTITY_LABEL}`);
      expect(await entityCodeEditor.textContentOfLineByLineNumber(3)).toMatch(`name: "${NEW_ENTITY_LABEL}"`);
      await entityCodeEditor.saveAndClose();
   });

   test('Edit entity name & description via properties', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      const properties = await diagramEditor.selectEntityAndOpenProperties(NEW_ENTITY_LABEL);
      const form = await properties.form();
      await form.generalSection.setName(RENAMED_ENTITY_LABEL);
      await form.generalSection.setDescription(RENAMED_ENTITY_DESCRIPTION);
      await form.waitForDirty();
      // Verify that the entity was renamed as expected
      expect(await form.generalSection.getName()).toBe(RENAMED_ENTITY_LABEL);
      expect(await form.generalSection.getDescription()).toBe(RENAMED_ENTITY_DESCRIPTION);
      await properties.saveAndClose();
      await diagramEditor.activate();
      await diagramEditor.saveAndClose();

      const entityCodeEditor = await app.openCompositeEditor(NEW_ENTITY_PATH, 'Code Editor');

      expect(await entityCodeEditor.textContentOfLineByLineNumber(3)).toMatch(`name: "${RENAMED_ENTITY_LABEL}"`);
      expect(await entityCodeEditor.textContentOfLineByLineNumber(4)).toMatch(`description: "${RENAMED_ENTITY_DESCRIPTION}"`);
      await entityCodeEditor.saveAndClose();
   });

   test('Hide new entity', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      await diagramEditor.activate();
      const renamedEntity = await diagramEditor.getEntity(RENAMED_ENTITY_LABEL);
      // Hide entity
      await diagramEditor.waitForModelUpdate(async () => {
         await diagramEditor.enableTool('Hide');
         await renamedEntity.click();
      });

      // Check if entity is actually just hidden, i.e. can be shown again
      const position = (await diagramEditor.diagram.graph.bounds()).position('middle_center');
      await diagramEditor.invokeShowEntityToolAtPosition(position);
      const entitySuggestions = await diagramEditor.diagram.globalCommandPalette.suggestions();
      expect(entitySuggestions).toContain(NEW_ENTITY_LABEL);

      await diagramEditor.saveAndClose();
   });

   test('Delete new entity', async () => {
      const explorer = await app.openExplorerView();
      await explorer.deleteNode(NEW_ENTITY_PATH, true);
      expect(await explorer.findTreeNode(NEW_ENTITY_PATH)).toBeUndefined();
      // Check if entity is actually deleted, i.e. can not be shown (using keyboard shortcut)
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      const position = (await diagramEditor.diagram.graph.bounds()).position('middle_center');
      await diagramEditor.invokeShowEntityToolAtPosition(position);
      const entitySuggestions = await diagramEditor.diagram.globalCommandPalette.suggestions();
      expect(entitySuggestions).not.toContain(NEW_ENTITY_LABEL);
      await diagramEditor.close();
   });
});
