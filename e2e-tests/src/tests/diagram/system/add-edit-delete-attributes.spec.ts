/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { expect } from '@eclipse-glsp/glsp-playwright';
import { test } from '@playwright/test';
import { CMApp } from '../../../page-objects/cm-app';
import { Attribute } from '../../../page-objects/system-diagram/diagram-elements';

test.describe.serial('Add/Edit/Delete attributes to/from an entity in a diagram', () => {
   let app: CMApp;
   const SYSTEM_DIAGRAM_PATH = 'ExampleCRM/diagrams/EMPTY.system-diagram.cm';
   const ENTITY_PATH = 'ExampleCRM/entities/EmptyEntity.entity.cm';
   const ENTITY_ID = 'EmptyEntity';

   test.beforeAll(async ({ browser, playwright }) => {
      app = await CMApp.load({ browser, playwright });
   });
   test.afterAll(async () => {
      await app.page.close();
   });

   test('Add attribute via properties view', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      await diagramEditor.waitForCreationOfType(Attribute, async () => {
         const propertyView = await diagramEditor.selectEntityAndOpenProperties(ENTITY_ID);
         const form = await propertyView.form();
         const attribute = await form.attributesSection.addAttribute();
         await form.waitForDirty();

         // Verify that the attribute was added as expected to the properties view
         const properties = await attribute.getProperties();
         expect(properties).toMatchObject({ name: 'New Attribute', datatype: 'Varchar', identifier: false, description: '' });
         await propertyView.saveAndClose();
      });

      // Verify that the attribute was added as expected to the diagram
      const entity = await diagramEditor.getEntity(ENTITY_ID);
      const attributeNodes = await entity.children.attributes();
      expect(attributeNodes).toHaveLength(1);
      const attributeNode = attributeNodes[0];
      expect(await attributeNode.datatype()).toEqual('Varchar');
      expect(await attributeNode.name()).toEqual('New Attribute');
      await diagramEditor.saveAndClose();

      // Verify that the attribute was added as expected to the entity;
      const entityCodeEditor = await app.openCompositeEditor(ENTITY_PATH, 'Code Editor');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(4)).toMatch('attributes:');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(5)).toMatch('- id: New_Attribute');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(6)).toMatch('name: "New Attribute"');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(7)).toMatch('datatype: "Varchar"');

      await entityCodeEditor.saveAndClose();
   });

   test('Edit attribute  via properties view', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      const propertyView = await diagramEditor.selectEntityAndOpenProperties(ENTITY_ID);
      const form = await propertyView.form();
      const attribute = await form.attributesSection.getAttribute('New Attribute');

      await attribute.setName('Renamed Attribute');
      await attribute.setDatatype('Bool');
      await attribute.toggleIdentifier();
      await attribute.setDescription('New Description');
      await form.waitForDirty();

      // Verify that the attribute was changed as expected in the properties view
      const properties = await attribute.getProperties();
      expect(properties).toMatchObject({ name: 'Renamed Attribute', datatype: 'Bool', identifier: true, description: 'New Description' });
      await propertyView.saveAndClose();

      // Verify that the attribute was added as expected to the entity;
      const entityCodeEditor = await app.openCompositeEditor(ENTITY_PATH, 'Code Editor');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(6)).toMatch('name: "Renamed Attribute"');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(7)).toMatch('datatype: "Bool"');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(8)).toMatch('identifier: true');
      expect(await entityCodeEditor.textContentOfLineByLineNumber(9)).toMatch('description: "New Description"');
      await entityCodeEditor.saveAndClose();
   });

   test('Delete the attribute via properties view', async () => {
      const diagramEditor = await app.openCompositeEditor(SYSTEM_DIAGRAM_PATH, 'System Diagram');
      const propertyView = await diagramEditor.selectEntityAndOpenProperties(ENTITY_ID);
      const form = await propertyView.form();
      await diagramEditor.waitForModelUpdate(async () => {
         await form.attributesSection.deleteAttribute('Renamed Attribute');
         await form.waitForDirty();
      });

      // Verify that the attribute was deleted as expected from the properties view
      const attribute = await form.attributesSection.findAttribute('Renamed Attribute');
      expect(attribute).toBeUndefined();
      await propertyView.saveAndClose();

      // Verify that the attribute was deleted as expected from the diagram
      await diagramEditor.activate();
      const entity = await diagramEditor.getEntity(ENTITY_ID);
      const attributeNodes = await entity.children.attributes();
      expect(attributeNodes).toHaveLength(0);
      await diagramEditor.saveAndClose();

      // Verify that the attribute was deleted as expected from the entity;
      const entityCodeEditor = await app.openCompositeEditor(ENTITY_PATH, 'Code Editor');
      expect(await entityCodeEditor.numberOfLines()).toBe(3);
      await entityCodeEditor.saveAndClose();
   });
});
