/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { beforeAll, describe, expect, test } from '@jest/globals';
import { Reference } from 'langium';

import _ from 'lodash';
import { CrossModelSerializer } from '../../../src/language-server/cross-model-serializer.js';
import { CrossModelRoot, Entity, Relationship } from '../../../src/language-server/generated/ast.js';

describe('CrossModelLexer', () => {
   let serializer: CrossModelSerializer;

   beforeAll(() => {
      serializer = new CrossModelSerializer();
   });

   describe('Serialize entity', () => {
      let crossModelRoot: CrossModelRoot;
      let crossModelRootWithoutAttributes: CrossModelRoot;
      let crossModelRootWithAttributesDifPlace: CrossModelRoot;

      beforeAll(() => {
         crossModelRoot = {
            $type: 'CrossModelRoot'
         };

         crossModelRootWithAttributesDifPlace = _.cloneDeep(crossModelRoot);

         crossModelRoot.entity = {
            $container: crossModelRoot,
            $type: 'Entity',
            description: 'Test description',
            id: 'testId',
            name: 'test Name',
            attributes: []
         };

         crossModelRootWithoutAttributes = _.cloneDeep(crossModelRoot);

         crossModelRoot.entity.attributes = [
            { $container: crossModelRoot.entity, $type: 'EntityAttribute', id: 'Attribute1', datatype: 'Datatype Attribute 1' },
            { $container: crossModelRoot.entity, $type: 'EntityAttribute', id: 'Attribute2', datatype: 'Datatype Attribute 2' }
         ];

         crossModelRootWithAttributesDifPlace.entity = {
            $container: crossModelRoot,
            $type: 'Entity',
            description: 'Test description',
            attributes: [],
            id: 'testId',
            name: 'test Name'
         };
         crossModelRootWithAttributesDifPlace.entity.attributes = [
            { $container: crossModelRoot.entity, $type: 'EntityAttribute', id: 'Attribute1', datatype: 'Datatype Attribute 1' },
            { $container: crossModelRoot.entity, $type: 'EntityAttribute', id: 'Attribute2', datatype: 'Datatype Attribute 2' }
         ];
      });

      test('serialize entity with attributes', () => {
         const parseResult = serializer.serialize(crossModelRoot);
         expect(parseResult).toBe(expected_result);
      });

      test('serialize entity without attributes', () => {
         const parseResult = serializer.serialize(crossModelRootWithoutAttributes);

         expect(parseResult).toBe(expected_result2);
      });

      test('serialize entity with attributes in different place', () => {
         const parseResult = serializer.serialize(crossModelRootWithAttributesDifPlace);

         expect(parseResult).toBe(expected_result3);
      });
   });

   describe('Serialize relationship', () => {
      let crossModelRoot: CrossModelRoot;

      beforeAll(() => {
         crossModelRoot = {
            $type: 'CrossModelRoot'
         };

         const ref1: Reference<Entity> = {
            $refText: 'Ref1',
            ref: {
               $container: crossModelRoot,
               $type: 'Entity',
               description: 'Test description',
               attributes: [],
               id: 'Ref1',
               name: 'test Name'
            }
         };

         const ref2: Reference<Entity> = {
            $refText: 'Ref2',
            ref: {
               $container: crossModelRoot,
               $type: 'Entity',
               description: 'Test description',
               attributes: [],
               id: 'Ref2',
               name: 'test Name'
            }
         };

         crossModelRoot.relationship = {
            $container: crossModelRoot,
            $type: 'Relationship',
            description: 'Test description',
            id: 'testId',
            name: 'test Name',
            parent: ref1,
            child: ref2,
            type: 'n:m'
         };
      });

      test('serialize entity with attributes', () => {
         const parseResult = serializer.serialize(crossModelRoot);
         expect(parseResult).toBe(expected_result4);
      });
   });

   describe('Serialize diagram', () => {
      let crossModelRoot: CrossModelRoot;

      beforeAll(() => {
         crossModelRoot = {
            $type: 'CrossModelRoot'
         };

         const ref1: Reference<Entity> = {
            $refText: 'Ref1',
            ref: {
               $container: crossModelRoot,
               $type: 'Entity',
               description: 'Test description',
               attributes: [],
               id: 'Ref1',
               name: 'test Name'
            }
         };

         const ref2: Reference<Entity> = {
            $refText: 'Ref2',
            ref: {
               $container: crossModelRoot,
               $type: 'Entity',
               description: 'Test description',
               attributes: [],
               id: 'Ref2',
               name: 'test Name'
            }
         };

         const ref3: Reference<Relationship> = {
            $refText: 'Ref3',
            ref: {
               $container: crossModelRoot,
               $type: 'Relationship',
               description: 'Test description',
               id: 'testId',
               name: 'test Name',
               parent: ref1,
               child: ref2,
               type: 'n:m'
            }
         };

         crossModelRoot.systemDiagram = {
            $container: crossModelRoot,
            $type: 'SystemDiagram',
            description: 'Test description',
            id: 'testId',
            name: 'test Name',
            nodes: [],
            edges: []
         };

         crossModelRoot.systemDiagram.nodes = [
            {
               $container: crossModelRoot.systemDiagram,
               $type: 'EntityNode',
               x: 100,
               y: 101,
               width: 102,
               height: 102,
               entity: ref1,
               id: 'Node1',
               name: 'Node 1'
            },
            {
               $container: crossModelRoot.systemDiagram,
               $type: 'EntityNode',
               x: 100,
               y: 101,
               width: 102,
               height: 102,
               entity: ref2,
               id: 'Node2',
               name: 'Node 2'
            }
         ];

         crossModelRoot.systemDiagram.edges = [
            {
               $container: crossModelRoot.systemDiagram,
               $type: 'RelationshipEdge',
               relationship: ref3,
               id: 'Edge1'
            }
         ];
      });

      test('serialize entity with attributes', () => {
         const parseResult = serializer.serialize(crossModelRoot);
         expect(parseResult).toBe(expected_result5);
      });
   });
});

const expected_result = `entity:
    id: testId
    name: "test Name"
    description: "Test description"
    attributes:
      - id: Attribute1
        datatype: "Datatype Attribute 1"
      - id: Attribute2
        datatype: "Datatype Attribute 2"`;
const expected_result2 = `entity:
    id: testId
    name: "test Name"
    description: "Test description"`;
const expected_result3 = `entity:
    id: testId
    name: "test Name"
    description: "Test description"
    attributes:
      - id: Attribute1
        datatype: "Datatype Attribute 1"
      - id: Attribute2
        datatype: "Datatype Attribute 2"`;

const expected_result4 = `relationship:
    id: testId
    name: "test Name"
    description: "Test description"
    parent: Ref1
    child: Ref2
    type: "n:m"`;
const expected_result5 = `systemDiagram:
    id: testId
    name: "test Name"
    description: "Test description"
    nodes:
      - id: Node1
        name: "Node 1"
        entity: Ref1
        x: 100
        y: 101
        width: 102
        height: 102
      - id: Node2
        name: "Node 2"
        entity: Ref2
        x: 100
        y: 101
        width: 102
        height: 102
    edges:
      - id: Edge1
        relationship: Ref3`;
