/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { expect } from '@playwright/test';
import test, { app } from '../fixtures/crossmodel-fixture';

test.describe('CrossModel App', () => {
    test('main content panel visible', async () => {
        expect(await app.isMainContentPanelVisible()).toBe(true);
    });
});
