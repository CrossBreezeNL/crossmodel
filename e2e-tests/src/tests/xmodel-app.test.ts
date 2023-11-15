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

// test('Create new entity from workspace toolbar', async ({ page }) => {
//     const exampleEntityname = 'ExampleEntity';
//     const exampleFileName = '${exampleEntityname}.entity.cm';

//     await page.goto('http://localhost:3000/#/c:/git/GitHub/crossmodel/examples/yaml-example');
//     await page.getByText('View').click();
//     await page.getByText('Explorer').nth(3).click();

//     // Store the location to the files list.
//     const explorerFilesList = await page.locator('#files');

//     // The example file should not be in the workspace yet.
//     await expect(explorerFilesList).not.toContainText(exampleFileName);

//     // Create the entity.
//     await page.getByTitle('New Entity...').click();
//     await page.getByPlaceholder('New Entity').fill(exampleEntityname);
//     await page.getByRole('button', { name: 'OK' }).click();

//     // Expect the new file to be in the files list.
//     await expect(explorerFilesList.getByText(exampleFileName)).toBeVisible();

//     // Now we delete the file.
//     await explorerFilesList.getByText(exampleFileName).click({
//         button: 'right'
//     });
//     await page.getByText('Delete').first().click();
//     await page.getByRole('button', { name: 'OK' }).click();
// });
