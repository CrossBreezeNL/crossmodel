/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './src/tests',
    testMatch: ['**/*.test.ts'],
    workers: process.env.CI ? 1 : 2,
    retries: process.env.CI ? 1 : 0,
    // The number of times to repeat each test, useful for debugging flaky tests
    repeatEach: 1,
    // Timeout for each test in milliseconds.
    timeout: 30 * 1000,
    use: {
        baseURL: 'http://localhost:3000',
        browserName: 'chromium',
        screenshot: 'only-on-failure',
        viewport: { width: 1920, height: 1080 }
    },
    snapshotDir: './src/tests/snapshots',
    expect: {
        toMatchSnapshot: { threshold: 0.01 }
    },
    preserveOutput: 'failures-only',
    reporter: process.env.CI ? [['list'], ['html'], ['github']] : [['list'], ['html']],
    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'yarn --cwd ../../ start:browser',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI
    }
});
