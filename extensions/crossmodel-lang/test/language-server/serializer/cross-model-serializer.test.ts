/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { beforeAll, describe, expect, test, jest } from '@jest/globals';
import { EmptyFileSystem, Reference } from 'langium';

import _ from 'lodash';
import { createCrossModelServices } from '../../../src/language-server/cross-model-module.js';
import { CrossModelSerializer } from '../../../src/language-server/cross-model-serializer.js';
import { CrossModelRoot, Entity, Relationship } from '../../../src/language-server/generated/ast.js';

jest.useFakeTimers();

const services = createCrossModelServices({ ...EmptyFileSystem }).CrossModel;

describe('CrossModelLexer', () => {
    let serializer: CrossModelSerializer;

    beforeAll(() => {
        serializer = new CrossModelSerializer(services);
    });

    describe('Serialize entity', () => {
        let crossModelRoot: CrossModelRoot;
        let crossModelRootwithoutAttributes: CrossModelRoot;
        let crossModelRootwithAttributesDifPlace: CrossModelRoot;

        beforeAll(() => {
            crossModelRoot = {
                $type: 'CrossModelRoot'
            };

            crossModelRootwithAttributesDifPlace = _.cloneDeep(crossModelRoot);

            crossModelRoot.entity = {
                $container: crossModelRoot,
                $type: 'Entity',
                description: 'Test description',
                name: 'test id',
                name_val: 'test Name',
                attributes: []
            };

            crossModelRootwithoutAttributes = _.cloneDeep(crossModelRoot);

            crossModelRoot.entity.attributes = [
                { $container: crossModelRoot.entity, $type: 'EntityAttribute', name: 'Attribute 1', datatype: 'Datatype Attribute 1' },
                { $container: crossModelRoot.entity, $type: 'EntityAttribute', name: 'Attribute 2', datatype: 'Datatype Attribute 2' }
            ];

            crossModelRootwithAttributesDifPlace.entity = {
                $container: crossModelRoot,
                $type: 'Entity',
                description: 'Test description',
                attributes: [],
                name: 'test id',
                name_val: 'test Name'
            };
            crossModelRootwithAttributesDifPlace.entity.attributes = [
                { $container: crossModelRoot.entity, $type: 'EntityAttribute', name: 'Attribute 1', datatype: 'Datatype Attribute 1' },
                { $container: crossModelRoot.entity, $type: 'EntityAttribute', name: 'Attribute 2', datatype: 'Datatype Attribute 2' }
            ];
        });

        test('serialize entity with attributes', () => {
            const parseResult = serializer.serialize(crossModelRoot);
            expect(parseResult).toBe(expected_result);
        });

        test('serialize entity without attributes', () => {
            const parseResult = serializer.serialize(crossModelRootwithoutAttributes);

            expect(parseResult).toBe(expected_result2);
        });

        test('serialize entity with attributes in different place', () => {
            const parseResult = serializer.serialize(crossModelRootwithAttributesDifPlace);

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
                    name: 'Ref1',
                    name_val: 'test Name'
                }
            };

            const ref2: Reference<Entity> = {
                $refText: 'Ref2',
                ref: {
                    $container: crossModelRoot,
                    $type: 'Entity',
                    description: 'Test description',
                    attributes: [],
                    name: 'Ref2',
                    name_val: 'test Name'
                }
            };

            crossModelRoot.relationship = {
                $container: crossModelRoot,
                $type: 'Relationship',
                description: 'Test description',
                name: 'test id',
                name_val: 'test Name',
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
                    name: 'Ref1',
                    name_val: 'test Name'
                }
            };

            const ref2: Reference<Entity> = {
                $refText: 'Ref2',
                ref: {
                    $container: crossModelRoot,
                    $type: 'Entity',
                    description: 'Test description',
                    attributes: [],
                    name: 'Ref2',
                    name_val: 'test Name'
                }
            };

            const ref3: Reference<Relationship> = {
                $refText: 'Ref3',
                ref: {
                    $container: crossModelRoot,
                    $type: 'Relationship',
                    description: 'Test description',
                    name: 'test id',
                    name_val: 'test Name',
                    parent: ref1,
                    child: ref2,
                    type: 'n:m'
                }
            };

            crossModelRoot.diagram = {
                $container: crossModelRoot,
                $type: 'SystemDiagram',
                description: 'Test description',
                name: 'test id',
                name_val: 'test Name',
                nodes: [],
                edges: []
            };

            crossModelRoot.diagram.nodes = [
                {
                    $container: crossModelRoot.diagram,
                    $type: 'DiagramNode',
                    x: 100,
                    y: 101,
                    width: 102,
                    height: 102,
                    entity: ref1,
                    name: 'Node1',
                    name_val: 'Node 1'
                },
                {
                    $container: crossModelRoot.diagram,
                    $type: 'DiagramNode',
                    x: 100,
                    y: 101,
                    width: 102,
                    height: 102,
                    entity: ref2,
                    name: 'Node2',
                    name_val: 'Node 2'
                }
            ];

            crossModelRoot.diagram.edges = [
                {
                    $container: crossModelRoot.diagram,
                    $type: 'DiagramEdge',
                    relationship: ref3,
                    name: 'Edge1'
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
    id: "test id"
    name: "test Name"
    description: "Test description"
    attributes:
      - id: "Attribute 1"
        datatype: "Datatype Attribute 1"
      - id: "Attribute 2"
        datatype: "Datatype Attribute 2"`;
const expected_result2 = `entity:
    id: "test id"
    name: "test Name"
    description: "Test description"`;
const expected_result3 = `entity:
    id: "test id"
    name: "test Name"
    description: "Test description"
    attributes:
      - id: "Attribute 1"
        datatype: "Datatype Attribute 1"
      - id: "Attribute 2"
        datatype: "Datatype Attribute 2"`;

const expected_result4 = `relationship:
    id: "test id"
    name: "test Name"
    description: "Test description"
    parent: "Ref1"
    child: "Ref2"
    type: "n:m"`;
const expected_result5 = `diagram:
    id: "test id"
    name: "test Name"
    description: "Test description"
    nodes:
      - id: "Node1"
        name: "Node 1"
        entity: "Ref1"
        x: 100
        y: 101
        width: 102
        height: 102
      - id: "Node2"
        name: "Node 2"
        entity: "Ref2"
        x: 100
        y: 101
        width: 102
        height: 102
    edges:
      - id: "Edge1"
        relationship: "Ref3"`;
