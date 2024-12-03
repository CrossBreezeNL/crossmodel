/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { describe, expect, test } from '@jest/globals';
import { isReference } from 'langium';

import { diagram1, diagram2, diagram3, diagram4, diagram5, diagram6 } from './test-utils/test-documents/diagram/index.js';
import { createCrossModelTestServices, parseSystemDiagram } from './test-utils/utils.js';

const services = createCrossModelTestServices();

describe('CrossModel language Diagram', () => {
   describe('Diagram without nodes and edges', () => {
      test('Simple file for diagram', async () => {
         const systemDiagram = await parseSystemDiagram({ services, text: diagram1 });
         expect(systemDiagram?.id).toBe('Systemdiagram1');
      });

      test('Diagram with indentation and dedentation error', async () => {
         await parseSystemDiagram({ services, text: diagram4 }, { parserErrors: 2 });
      });
   });

   describe('Diagram with nodes', () => {
      test('Simple file for diagram and nodes', async () => {
         const systemDiagram = await parseSystemDiagram({ services, text: diagram2 });

         expect(systemDiagram?.nodes).toHaveLength(1);
         const node1 = systemDiagram?.nodes[0];
         expect(node1?.id).toBe('CustomerNode');
         expect(isReference(node1?.entity)).toBe(true);
         expect(node1?.entity?.$refText).toBe('Customer');
         expect(node1?.x).toBe(100);
      });
   });

   describe('Diagram with edges', () => {
      test('Simple file for diagram and edges', async () => {
         const systemDiagram = await parseSystemDiagram({ services, text: diagram3 });

         expect(systemDiagram?.edges).toHaveLength(1);
         const edge1 = systemDiagram?.edges[0];
         expect(edge1?.id).toBe('OrderCustomerEdge');
         expect(isReference(edge1?.relationship)).toBe(true);
         expect(edge1?.relationship?.$refText).toBe('Order_Customer');
      });
   });

   describe('Diagram with nodes and edges', () => {
      test('Simple file for diagram and edges', async () => {
         const systemDiagram = await parseSystemDiagram({ services, text: diagram5 });

         expect(systemDiagram?.name).toBe('System diagram 1');
         expect(systemDiagram?.description).toBe('This is a basic diagram with nodes and edges');

         expect(systemDiagram?.nodes).toHaveLength(1);
         const node1 = systemDiagram?.nodes[0];
         expect(node1?.id).toBe('CustomerNode');
         expect(isReference(node1?.entity)).toBe(true);
         expect(node1?.entity?.$refText).toBe('Customer');
         expect(node1?.x).toBe(100);

         expect(systemDiagram?.edges).toHaveLength(1);
         const edge1 = systemDiagram?.edges[0];
         expect(edge1?.id).toBe('OrderCustomerEdge');
         expect(isReference(edge1?.relationship)).toBe(true);
         expect(edge1?.relationship?.$refText).toBe('Order_Customer');
      });

      test('Simple file for diagram and edges, but description and name coming last', async () => {
         const systemDiagram = await parseSystemDiagram({ services, text: diagram6 }, { parserErrors: 3 });

         const node1 = systemDiagram?.nodes[0];

         expect(systemDiagram?.name).toBeUndefined();
         expect(systemDiagram?.description).toBeUndefined();

         expect(systemDiagram?.nodes).toHaveLength(1);
         expect(node1?.id).toBe('CustomerNode');
         expect(isReference(node1?.entity)).toBe(true);
         expect(node1?.entity?.$refText).toBe('Customer');
         expect(node1?.x).toBe(100);

         expect(systemDiagram?.edges).toHaveLength(1);
         const edge1 = systemDiagram?.edges[0];
         expect(edge1?.id).toBe('OrderCustomerEdge');
         expect(isReference(edge1?.relationship)).toBe(true);
         expect(edge1?.relationship?.$refText).toBe('Order_Customer');
      });
   });
});
