/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { describe, expect, test } from '@jest/globals';
import { EmptyFileSystem, isReference } from 'langium';

import { parseDocument } from './test-utils/utils.js';
import { relationship1, relationship2 } from './test-utils/test-documents/relationship/index.js';

import { CrossModelRoot } from '../../src/language-server/generated/ast.js';
import { createCrossModelServices } from '../../src/language-server/cross-model-module.js';

const services = createCrossModelServices({ ...EmptyFileSystem }).CrossModel;

describe('CrossModel language Relationship', () => {
   test('Simple file for relationship', async () => {
      const document = relationship1;
      const parsedDocument = await parseDocument(services, document);
      const model = parsedDocument.parseResult.value as CrossModelRoot;

      expect(model).toHaveProperty('relationship');
      expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
      expect(parsedDocument.parseResult.parserErrors.length).toBe(0);

      expect(model.relationship?.name).toBe('Order_Customer');
      expect(model.relationship?.name_val).toBe('Customer Order relationship');
      expect(model.relationship?.type).toBe('1:1');
      expect(model.relationship?.description).toBe('A relationship between a customer and an order.');

      expect(isReference(model.relationship?.parent)).toBe(true);
      expect(isReference(model.relationship?.child)).toBe(true);
      expect(model.relationship?.parent?.$refText).toBe('Customer');
      expect(model.relationship?.child?.$refText).toBe('Order');
   });

   test('relationship with indentation error', async () => {
      const document = relationship2;
      const parsedDocument = await parseDocument(services, document);
      const model = parsedDocument.parseResult.value as CrossModelRoot;

      expect(model).toHaveProperty('relationship');
      expect(parsedDocument.parseResult.lexerErrors.length).toBe(0);
      expect(parsedDocument.parseResult.parserErrors.length).toBe(1);
   });
});
