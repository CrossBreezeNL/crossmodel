/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { describe, expect, test } from '@jest/globals';
import { isReference } from 'langium';

import {
   relationship1,
   relationship2,
   relationship_with_attribute,
   relationship_with_attribute_wrong_entity,
   relationship_with_duplicate_attributes
} from './test-utils/test-documents/relationship/index.js';
import { createCrossModelTestServices, parseAndForgetDocument, parseDocuments } from './test-utils/utils.js';

import { CrossModelRoot } from '../../src/language-server/generated/ast.js';
import { address } from './test-utils/test-documents/entity/address.js';
import { customer } from './test-utils/test-documents/entity/customer.js';
import { order } from './test-utils/test-documents/entity/order.js';

const services = createCrossModelTestServices();

describe('CrossModel language Relationship', () => {
   beforeAll(() => {
      parseDocuments(services, [order, customer, address]);
   });

   test('Simple file for relationship', async () => {
      const document = relationship1;
      const parsedDocument = await parseAndForgetDocument(services, document);
      const model = parsedDocument.parseResult.value as CrossModelRoot;

      expect(model).toHaveProperty('relationship');
      expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
      expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

      expect(model.relationship?.id).toBe('Order_Customer');
      expect(model.relationship?.name).toBe('Customer Order relationship');
      expect(model.relationship?.type).toBe('1:1');
      expect(model.relationship?.description).toBe('A relationship between a customer and an order.');

      expect(isReference(model.relationship?.parent)).toBe(true);
      expect(isReference(model.relationship?.child)).toBe(true);
      expect(model.relationship?.parent?.$refText).toBe('Customer');
      expect(model.relationship?.child?.$refText).toBe('Order');
   });

   test('relationship with indentation error', async () => {
      const document = relationship2;
      const parsedDocument = await parseAndForgetDocument(services, document);
      const model = parsedDocument.parseResult.value as CrossModelRoot;

      expect(model).toHaveProperty('relationship');
      expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
      expect(parsedDocument.parseResult.parserErrors.length).toBe(1);
   });

   test('relationship with attributes', async () => {
      const parsedDocument = await parseAndForgetDocument(services, relationship_with_attribute, {
         validation: true
      });
      const model = parsedDocument.parseResult.value as CrossModelRoot;

      expect(model).toHaveProperty('relationship');
      expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
      expect(parsedDocument.parseResult.parserErrors.length).toBe(0);
      expect(parsedDocument.diagnostics).toHaveLength(0);
   });

   test('relationship with wrong entity', async () => {
      const parsedDocument = await parseAndForgetDocument(services, relationship_with_attribute_wrong_entity, {
         validation: true
      });
      const model = parsedDocument.parseResult.value as CrossModelRoot;

      expect(model).toHaveProperty('relationship');
      expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
      expect(parsedDocument.parseResult.parserErrors.length).toBe(0);
      expect(parsedDocument.diagnostics).toHaveLength(1);
   });

   test('relationship with duplicates', async () => {
      const parsedDocument = await parseAndForgetDocument(services, relationship_with_duplicate_attributes, {
         validation: true
      });
      const model = parsedDocument.parseResult.value as CrossModelRoot;

      expect(model).toHaveProperty('relationship');
      expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
      expect(parsedDocument.parseResult.parserErrors.length).toBe(0);
      expect(parsedDocument.diagnostics).toHaveLength(2);
   });
});
