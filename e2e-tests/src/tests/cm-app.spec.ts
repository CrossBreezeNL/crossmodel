/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { expect, test } from '@playwright/test';
import { CMApp } from '../page-objects/cm-app';

test.describe('CrossModel App', () => {
   let app: CMApp;

   test.beforeAll(async ({ browser, playwright }) => {
      app = await CMApp.load({ browser, playwright });
   });

   test('main content panel visible', async () => {
      expect(await app.isMainContentPanelVisible()).toBe(true);
   });
});
