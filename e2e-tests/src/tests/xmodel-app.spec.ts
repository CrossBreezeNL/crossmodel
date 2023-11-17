/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { test, expect, Page } from '@playwright/test';
import { CrossModelApp } from '../page-objects/crossmodel-app';

let page: Page;
let app: CrossModelApp;

test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    app = await CrossModelApp.loadApp(page, CrossModelApp);
});

test.describe('CrossModel is visible', () => {
    test('should show main content panel', async () => {
        expect(await app.isMainContentPanelVisible()).toBe(true);
    });
});
