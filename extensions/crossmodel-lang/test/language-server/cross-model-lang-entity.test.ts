/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { describe, expect, test } from '@jest/globals';
import { EmptyFileSystem } from 'langium';

import { entity1, entity2, entity3, entity4 } from './test-utils/test-documents/entity/index.js';
import { parseDocument } from './test-utils/utils.js';

import { createCrossModelServices } from '../../src/language-server/cross-model-module.js';
import { CrossModelRoot } from '../../src/language-server/generated/ast.js';

const services = createCrossModelServices({ ...EmptyFileSystem }).CrossModel;

describe('CrossModel language Entity', () => {
   describe('Without attributes', () => {
      test('Simple file for entity', async () => {
         const document = entity1;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;

         expect(model).toHaveProperty('entity');
         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

         expect(model.entity?.name).toBe('Customer');
         expect(model.entity?.name_val).toBe('Customer');
         expect(model.entity?.description).toBe('A customer with whom a transaction has been made.');
      });
   });

   describe('With attributes', () => {
      test('entity with attributes', async () => {
         const document = entity2;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;

         expect(model).toHaveProperty('entity');

         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

         expect(model.entity?.attributes.length).toBe(6);
         expect(model.entity?.attributes[0].name).toBe('Id');
         expect(model.entity?.attributes[0].name_val).toBe('Id');
         expect(model.entity?.attributes[0].datatype).toBe('int');
      });

      test('entity with attributes coming before the description and name', async () => {
         const document = entity4;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;

         expect(model).toHaveProperty('entity');
         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

         expect(model.entity?.name).toBe('Customer');
         expect(model.entity?.name_val).toBe('Customer');
         expect(model.entity?.description).toBe('A customer with whom a transaction has been made.');

         expect(model.entity?.attributes.length).toBe(6);
         expect(model.entity?.attributes[0].name).toBe('Id');
         expect(model.entity?.attributes[0].name_val).toBe('Id');
         expect(model.entity?.attributes[0].datatype).toBe('int');
      });

      test('entity with indentation error', async () => {
         const document = entity3;
         const parsedDocument = await parseDocument(services, document);
         const model = parsedDocument.parseResult.value as CrossModelRoot;

         expect(model).toHaveProperty('entity');
         expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
         expect(parsedDocument.parseResult.parserErrors.length).toBe(1);
      });
   });
});
