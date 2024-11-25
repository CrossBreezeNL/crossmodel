/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { expect } from '@eclipse-glsp/glsp-playwright';
import { test } from '@playwright/test';
import { CMApp } from '../../../page-objects/cm-app';
import { Entity } from '../../../page-objects/system-diagram/diagram-elements';

test.describe.serial('Add existing entity to a diagram', () => {
   let app: CMApp;
   const SYSTEM_DIAGRAM_PATH = 'ExampleCRM/diagrams/EMPTY.system-diagram.cm';
   const CUSTOMER_ID = 'Customer';

   test.beforeAll(async ({ browser, playwright }) => {
      app = await CMApp.load({ browser, playwright });
   });
   test.afterAll(async () => {
      await app.page.close();
   });

   test('Add existing entity via toolbox', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      const diagram = diagramEditor.diagram;
      // Create new entity
      await diagram.graph.waitForCreationOfType(Entity, async () => {
         const position = (await diagram.graph.bounds()).position('middle_center');
         await diagramEditor.invokeShowEntityToolAtPosition(position);
         await diagram.globalCommandPalette.search(CUSTOMER_ID, { confirm: true });
      });

      // Verify that the entity node was created as expected
      const customer = await diagramEditor.getEntity(CUSTOMER_ID);
      expect(customer).toBeDefined();

      const diagramCodeEditor = await diagramEditor.parent.switchToCodeEditor();
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(12)).toMatch('- id: CustomerNode');
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(13)).toMatch(`entity: ${CUSTOMER_ID}`);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(14)).toMatch(/x:\s*\d+/);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(15)).toMatch(/y:\s*\d+/);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(16)).toMatch(/width:\s*\d+/);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(17)).toMatch(/height:\s*\d+/);
      await diagramCodeEditor.saveAndClose();
   });

   test('Add existing entity via keyboard shortcut', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      const diagram = diagramEditor.diagram;
      // Create new entity
      await diagram.graph.waitForCreationOfType(Entity, async () => {
         await diagram.globalCommandPalette.open();
         await diagram.globalCommandPalette.search(CUSTOMER_ID, { confirm: true });
      });

      // Verify that the entity node was created as expected
      const customers = await diagramEditor.getEntities(CUSTOMER_ID);
      expect(customers).toHaveLength(2);

      const diagramCodeEditor = await diagramEditor.parent.switchToCodeEditor();
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(18)).toMatch('- id: CustomerNode1');
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(19)).toMatch(`entity: ${CUSTOMER_ID}`);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(20)).toMatch(/x:\s*\d+/);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(21)).toMatch(/y:\s*\d+/);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(22)).toMatch(/width:\s*\d+/);
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(23)).toMatch(/height:\s*\d+/);
      await diagramCodeEditor.saveAndClose();
   });
});
