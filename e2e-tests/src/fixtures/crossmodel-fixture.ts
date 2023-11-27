/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Page, test } from '@playwright/test';
import { CrossModelApp } from '../page-objects/crossmodel-app';
import { CrossModelWorkspace } from '../page-objects/crossmodel-workspace';

export let page: Page;
export let app: CrossModelApp;

test.beforeAll(async ({ browser }) => {
   page = await browser.newPage();
   const ws = new CrossModelWorkspace(['src/resources/sample-workspace']);
   app = await CrossModelApp.load(page, ws);
});

export default test;
