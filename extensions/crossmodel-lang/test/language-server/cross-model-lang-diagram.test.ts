/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { describe, expect, test } from '@jest/globals';
import { EmptyFileSystem, isReference } from 'langium';

import { diagram1, diagram2, diagram3, diagram4, diagram5, diagram6 } from './test-utils/test-documents/diagram/index.js';
import { parseDocument } from './test-utils/utils.js';

import { createCrossModelServices } from '../../src/language-server/cross-model-module.js';
import { CrossModelRoot } from '../../src/language-server/generated/ast.js';

const services = createCrossModelServices({ ...EmptyFileSystem }).CrossModel;

describe('CrossModel language Diagram', () => {
   describe('Diagram without nodes and edges', () => {
      test('Simple file for diagram', async () => {
         const document = diagram1;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;

         expect(model).toHaveProperty('diagram');
         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

         expect(model.diagram?.name).toBe('Systemdiagram1');
      });

      test('Diagram with indentation error', async () => {
         const document = diagram4;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;

         expect(model).toHaveProperty('diagram');
         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(1);
      });
   });

   describe('Diagram with nodes', () => {
      test('Simple file for diagram and nodes', async () => {
         const document = diagram2;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;
         const node1 = model.diagram?.nodes[0];

         expect(model).toHaveProperty('diagram');
         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

         expect(model.diagram?.nodes.length).toBe(1);

         expect(node1?.name).toBe('CustomerNode');
         expect(isReference(node1?.entity)).toBe(true);
         expect(node1?.entity?.$refText).toBe('Customer');
         expect(node1?.x).toBe(100);
      });
   });

   describe('Diagram with edges', () => {
      test('Simple file for diagram and edges', async () => {
         const document = diagram3;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;
         const edge1 = model.diagram?.edges[0];

         expect(model).toHaveProperty('diagram');
         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

         expect(model.diagram?.edges.length).toBe(1);

         expect(edge1?.name).toBe('OrderCustomerEdge');
         expect(isReference(edge1?.relationship)).toBe(true);
         expect(edge1?.relationship?.$refText).toBe('Order_Customer');
      });
   });

   describe('Diagram with nodes and edges', () => {
      test('Simple file for diagram and edges', async () => {
         const document = diagram5;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;
         const node1 = model.diagram?.nodes[0];
         const edge1 = model.diagram?.edges[0];

         expect(model).toHaveProperty('diagram');

         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

         expect(model.diagram?.name_val).toBe('System diagram 1');
         expect(model.diagram?.description).toBe('This is a basic diagram with nodes and edges');
         expect(model.diagram?.nodes.length).toBe(1);
         expect(model.diagram?.edges.length).toBe(1);

         expect(node1?.name).toBe('CustomerNode');
         expect(isReference(node1?.entity)).toBe(true);
         expect(node1?.entity?.$refText).toBe('Customer');
         expect(node1?.x).toBe(100);

         expect(edge1?.name).toBe('OrderCustomerEdge');
         expect(isReference(edge1?.relationship)).toBe(true);
         expect(edge1?.relationship?.$refText).toBe('Order_Customer');
      });

      test('Simple file for diagram and edges, but descirption and name coming last', async () => {
         const document = diagram6;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;
         const node1 = model.diagram?.nodes[0];
         const edge1 = model.diagram?.edges[0];

         expect(model).toHaveProperty('diagram');
         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

         expect(model.diagram?.name_val).toBe('System diagram 1');
         expect(model.diagram?.description).toBe('This is a basic diagram with nodes and edges');
         expect(model.diagram?.nodes.length).toBe(1);
         expect(model.diagram?.edges.length).toBe(1);

         expect(node1?.name).toBe('CustomerNode');
         expect(isReference(node1?.entity)).toBe(true);
         expect(node1?.entity?.$refText).toBe('Customer');
         expect(node1?.x).toBe(100);

         expect(edge1?.name).toBe('OrderCustomerEdge');
         expect(isReference(edge1?.relationship)).toBe(true);
         expect(edge1?.relationship?.$refText).toBe('Order_Customer');
      });
   });
});
