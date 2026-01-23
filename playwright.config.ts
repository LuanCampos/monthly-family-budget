import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for E2E Testing
 * 
 * This config sets up end-to-end testing for the Monthly Family Budget PWA
 * with support for:
 * - PWA testing
 * - Offline mode testing
 * - Service Worker testing
 * - Mobile viewport testing
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video recording on failure */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable service worker for PWA testing
        serviceWorkers: 'allow',
      },
    },

    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        serviceWorkers: 'allow',
      },
    },

    /* Test offline scenarios */
    {
      name: 'offline',
      use: {
        ...devices['Desktop Chrome'],
        serviceWorkers: 'allow',
        offline: true,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  /* Global timeout for each test */
  timeout: 30 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000,
  },
});
