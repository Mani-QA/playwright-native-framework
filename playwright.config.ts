import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for QADemo E-Commerce Application
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './tests',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Only run Priority 1 and 2 tests by default
  // Use --grep="@p3|@p4" to run lower priority tests
  grep: /@p1|@p2/,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  // Use blob reporter for CI sharding (merged to HTML in workflow), add github for annotations
  // HTML reporter for local runs
  reporter: process.env.CI
    ? [['blob'], ['github'], ['list']]
    : [['html', { open: 'never' }], ['list']],

  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: 'https://qademo.com',

    // Record trace ONLY when a test fails (on first retry)
    // This gives you a zip file to step through the failure time-travel style
    trace: 'retain-on-failure',

    // Ensure viewport is consistent between Local and CI
    viewport: { width: 1920, height: 1080 },

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Capture video on failure
    video: 'retain-on-failure',

    // Default timeout for actions
    actionTimeout: 15000,

    // Default navigation timeout
    navigationTimeout: 30000,
  },

  // Global timeout for each test
  timeout: 60000,

  // Expect timeout
  expect: {
    timeout: 10000,
  },

  // Configure projects - Chromium only for stable CI/CD
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Chrome Desktop - primary browser for testing
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // Uncomment below to enable cross-browser testing
    // Note: May require additional locator fixes for full compatibility
    
    // // Firefox Desktop
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    //   dependencies: ['setup'],
    // },

    // // WebKit Desktop
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    //   dependencies: ['setup'],
    // },

    // // Mobile Chrome
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    //   dependencies: ['setup'],
    // },

    // // Mobile Safari
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    //   dependencies: ['setup'],
    // },
  ],
});

