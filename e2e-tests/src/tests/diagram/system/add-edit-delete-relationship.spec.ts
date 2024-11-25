/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { expect, test } from '@playwright/test';
import { CMApp } from '../../../page-objects/cm-app';
import { RelationshipPropertiesView } from '../../../page-objects/cm-properties-view';
import { Relationship } from '../../../page-objects/system-diagram/diagram-elements';
import { IntegratedSystemDiagramEditor } from '../../../page-objects/system-diagram/integrated-system-diagram-editor';

test.describe.serial('Add/Edit/Delete relationship in a diagram ', () => {
   let app: CMApp;
   const SYSTEM_DIAGRAM_PATH = 'ExampleCRM/diagrams/CRM.system-diagram.cm';
   const CUSTOMER_ID = 'Customer';
   const ORDER_ID = 'Order';
   const NEW_RELATIONSHIP_PATH = 'ExampleCRM/relationships/CustomerToOrder.relationship.cm';

   test.beforeAll(async ({ browser, playwright }) => {
      app = await CMApp.load({ browser, playwright });
   });
   test.afterAll(async () => {
      await app.page.close();
   });

   async function getNewRelationship(diagramEditor: IntegratedSystemDiagramEditor): Promise<Relationship> {
      const sourceEntity = await diagramEditor.getEntity(CUSTOMER_ID);
      const targetEntity = await diagramEditor.getEntity(ORDER_ID);
      return diagramEditor.diagram.graph.getEdgeBetween(Relationship, { sourceNode: sourceEntity, targetNode: targetEntity });
   }

   test('create new relationship via toolbox', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      const sourceEntity = await diagramEditor.getEntity(CUSTOMER_ID);
      const targetEntity = await diagramEditor.getEntity(ORDER_ID);

      await diagramEditor.waitForCreationOfType(Relationship, async () => {
         await diagramEditor.enableTool('Create 1:1 Relationship');
         const targetPosition = (await targetEntity.bounds()).position('middle_center');
         await sourceEntity.dragToAbsolutePosition(targetPosition.data);
      });
      // Verify that the entity node was created as expected in the diagram
      const diagramCodeEditor = await diagramEditor.parent.switchToCodeEditor();
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(17)).toMatch('edges:');
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(18)).toMatch('- id: CustomerToOrderEdge');
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(19)).toMatch('relationship: ExampleCRM.CustomerToOrder');
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(20)).toMatch('sourceNode: CustomerNode');
      expect(await diagramCodeEditor.textContentOfLineByLineNumber(21)).toMatch('targetNode: OrderNode');
      await diagramCodeEditor.saveAndClose();

      // Verify that the relationship  was created as expected
      const explorer = await app.openExplorerView();
      expect(await explorer.existsFileNode(NEW_RELATIONSHIP_PATH)).toBeTruthy();

      const entityCodeEditor = await app.openCompositeEditor(NEW_RELATIONSHIP_PATH, 'Code Editor');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(1)).toBe('relationship:');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(2)).toMatch('id: CustomerToOrder');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(3)).toMatch('parent: Customer');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(4)).toMatch('child: Order');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(5)).toMatch('type: "1:1"');
      await entityCodeEditor.saveAndClose();
   });

   test('Edit relationship name & description via properties', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      const relationship = await getNewRelationship(diagramEditor);
      await relationship.select();
      const properties = await app.openView(RelationshipPropertiesView);
      const form = await properties.form();
      await form.generalSection.setName('RenamedRelationship');
      await form.generalSection.setDescription('RenamedRelationshipDescription');
      await form.waitForDirty();

      // Verify that the entity was renamed as expected
      expect(await form.generalSection.getName()).toBe('RenamedRelationship');
      expect(await form.generalSection.getDescription()).toBe('RenamedRelationshipDescription');
      await properties.saveAndClose();

      const entityCodeEditor = await app.openCompositeEditor(NEW_RELATIONSHIP_PATH, 'Code Editor');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(3)).toMatch('name: "RenamedRelationship');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(4)).toMatch(' description: "RenamedRelationshipDescription"');
      await entityCodeEditor.saveAndClose();
   });

   // Skipped for now. Deleting a relationship in the diagram does currently not remove the relationship from the file system.
   test.skip('Delete new relationship', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      const relationship = await getNewRelationship(diagramEditor);
      await relationship.delete();
      const diagramCodeEditor = await diagramEditor.parent.switchToCodeEditor();
      expect(await diagramCodeEditor.numberOfLines()).toBe(11);

      const explorer = await app.openExplorerView();
      expect(await explorer.findTreeNode(NEW_RELATIONSHIP_PATH)).toBeUndefined();
   });
});
