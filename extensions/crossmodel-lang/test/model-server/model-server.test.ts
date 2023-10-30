/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { describe, expect, test } from '@jest/globals';
import { NodeFileSystem } from 'langium/node';
import { createCrossModelServices } from '../../src/language-server/cross-model-module';
import { ModelService } from '../../src/model-server/model-service';

// Test written by Martin Fleck, added to this branch for Jest. Using Vitest is not necessary

// the model service actually needs a file system, so we use the NodeFileSystem
const services = createCrossModelServices({ ...NodeFileSystem });
const sharedServices = services.shared;

const modelService = new ModelService(sharedServices);

describe('Model Service', () => {
    test('Open on non-existing file should throw exception', async () => {
        try {
            await modelService.open({ uri: 'non-existing-uri', clientId: 'non-existing-client' });
        } catch (error) {
            expect(error).toHaveProperty('path', '\\non-existing-uri');
            expect(error).toBeDefined();
        }
    });
});
