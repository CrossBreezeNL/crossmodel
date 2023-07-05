/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import assert from 'assert';
import { EmptyFileSystem } from 'langium';
import { parseDocument } from 'langium/test';
import 'mocha';
import 'reflect-metadata';
import { describe, test } from 'vitest';
import { createCrossModelServices } from '../cross-model-module';
import { CrossModelRoot } from '../generated/ast';
import { findAvailableNodeName } from './name-util';

const services = createCrossModelServices({ ...EmptyFileSystem });
const cmServices = services.CrossModel;

describe('NameUtil', () => {
    describe('findAvailableNodeName', () => {
        test('should return given name if unique', async () => {
            const document = await parseDocument<CrossModelRoot>(cmServices, 'diagram {}');
            assert.strictEqual(findAvailableNodeName(document.parseResult.value.diagram!, 'nodeA'), 'nodeA');
        });

        test('should return unique name if given is taken', async () => {
            const document = await parseDocument<CrossModelRoot>(
                cmServices,
                `diagram {
                    node nodeA for A { x := 10; y := 10; width := 10; height := 10; };
                }`
            );
            assert.strictEqual(findAvailableNodeName(document.parseResult.value.diagram!, 'nodeA'), 'nodeA1');
        });

        test('should properly count up if name is taken', async () => {
            const document = await parseDocument<CrossModelRoot>(
                cmServices,
                `diagram {
                    node nodeA for A { x := 10; y := 10; width := 10; height := 10; }; 
                    node nodeA1 for A { x := 10; y := 10; width := 10; height := 10; };
                }`
            );
            assert.strictEqual(findAvailableNodeName(document.parseResult.value.diagram!, 'nodeA'), 'nodeA2');
        });

        test('should find lowest count if multiple are taken', async () => {
            const document = await parseDocument<CrossModelRoot>(
                cmServices,
                `diagram {
                    node nodeA for A { x := 10; y := 10; width := 10; height := 10; };
                    node nodeA1 for A { x := 10; y := 10; width := 10; height := 10; };
                    node nodeA2 for A { x := 10; y := 10; width := 10; height := 10; };
                    node nodeA4 for A { x := 10; y := 10; width := 10; height := 10; };
                }`
            );
            assert.strictEqual(findAvailableNodeName(document.parseResult.value.diagram!, 'nodeA'), 'nodeA3');
        });
    });
});
