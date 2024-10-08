/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { expandToString } from 'langium/generate';
import { expectCompletion } from 'langium/test';
import { address } from './test-utils/test-documents/entity/address.js';
import { customer } from './test-utils/test-documents/entity/customer.js';
import { order } from './test-utils/test-documents/entity/order.js';
import { createCrossModelTestServices, MockFileSystem, parseProject, testUri } from './test-utils/utils.js';

const services = createCrossModelTestServices(MockFileSystem);
const assertCompletion = expectCompletion(services);

describe('CrossModelCompletionProvider', () => {
   const text = expandToString`
    relationship:
       id: Address_Customer
       name: "Address - Customer"
       parent: <|>
    `;

   beforeAll(async () => {
      const packageA = await parseProject({
         package: { services, uri: testUri('projectA', 'package.json'), content: { name: 'ProjectA', version: '1.0.0' } },
         documents: [
            { services, text: address, documentUri: testUri('projectA', 'address.entity.cm') },
            { services, text: order, documentUri: testUri('projectA', 'order.entity.cm') }
         ]
      });

      await parseProject({
         package: {
            services,
            uri: testUri('projectB', 'package.json'),
            content: { name: 'ProjectB', version: '1.0.0', dependencies: { ...packageA } }
         },
         documents: [{ services, text: customer, documentUri: testUri('projectB', 'customer.entity.cm') }]
      });
   });

   test('Completion for entity references in project A', async () => {
      await assertCompletion({
         text,
         parseOptions: { documentUri: testUri('projectA', 'rel.relationship.cm') },
         index: 0,
         expectedItems: ['Address', 'Order'],
         disposeAfterCheck: true
      });
   });

   test('Completion for entity references in project B', async () => {
      await assertCompletion({
         text,
         parseOptions: { documentUri: testUri('projectB', 'rel.relationship.cm') },
         index: 0,
         expectedItems: ['Customer', 'ProjectA.Address', 'ProjectA.Order'],
         disposeAfterCheck: true
      });
   });
});
