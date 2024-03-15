/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { describe, expect, test } from '@jest/globals';
import { EntityNode } from '../../src/language-server/generated/ast.js';
import { createCrossModelTestServices, parseSystemDiagram } from './test-utils/utils.js';

const services = createCrossModelTestServices();

const ex1 = `systemDiagram:
    id: example1`;
const ex2 = `systemDiagram:
    id: example2
    nodes:
        - id: nodeA
          entity: NotExisting
          x: 0
          y: 0
          width: 0
          height: 0`;
const ex3 = `systemDiagram:
    id: example3
    nodes:
        - id: nodeA
          entity: NotExisting
          x: 0
          y: 0
          width: 0
          height: 0
        - id: nodeA1
          entity: NotExisting
          x: 0
          y: 0
          width: 0
          height: 0`;
const ex4 = `systemDiagram:
    id: example4
    nodes:
        - id: nodeA
          entity: NotExisting
          x: 0
          y: 0
          width: 0
          height: 0
        - id: nodeA1
          entity: NotExisting
          x: 0
          y: 0
          width: 0
          height: 0
        - id: nodeA2
          entity: NotExisting
          x: 0
          y: 0
          width: 0
          height: 0
        - id: nodeA4
          entity: NotExisting
          x: 0
          y: 0
          width: 0
          height: 0`;

describe('NameUtil', () => {
   describe('findAvailableNodeName', () => {
      test('should return given name if unique', async () => {
         const diagram = await parseSystemDiagram({ services, text: ex1 });
         expect(services.references.IdProvider.findNextId(EntityNode, 'nodeA', diagram)).toBe('nodeA');
      });

      test('should return unique name if given is taken', async () => {
         const diagram = await parseSystemDiagram({ services, text: ex2 });
         expect(services.references.IdProvider.findNextId(EntityNode, 'nodeA', diagram)).toBe('nodeA1');
      });

      test('should properly count up if name is taken', async () => {
         const diagram = await parseSystemDiagram({ services, text: ex3 });
         expect(services.references.IdProvider.findNextId(EntityNode, 'nodeA', diagram)).toBe('nodeA2');
      });

      test('should find lowest count if multiple are taken', async () => {
         const diagram = await parseSystemDiagram({ services, text: ex4 });
         expect(services.references.IdProvider.findNextId(EntityNode, 'nodeA', diagram)).toBe('nodeA3');
      });
   });
});
