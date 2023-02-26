import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './e2e',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter:
    [
      ['list'],
      ['html'],
      ['allure-playwright'],
      //[
      //  '@bgotink/playwright-coverage',
      ///** @type {import('@bgotink/playwright-coverage').CoverageReporterOptions} */ {
      //    // Path to the root files should be resolved from, most likely your repository root
      //    sourceRoot: __dirname,
      //    // Files to ignore in coverage, useful
      //    // - if you're testing the demo app of a component library and want to exclude the demo sources
      //    // - or part of the code is generated
      //    // - or if you're running into any of the other many reasons people have for excluding files
      //    exclude: ['**/node_modules/**', '**/webpack/**'],
      //    // Directory in which to write coverage reports
      //    resultDir: path.join(__dirname, 'results/e2e-coverage'),
      //    // Configure the reports to generate.
      //    // The value is an array of istanbul reports, with optional configuration attached.
      //    reports: [
      //      // Create an HTML view at <resultDir>/index.html
      //      ['html'],
      //      // Create <resultDir>/coverage.lcov for consumption by tooling
      //      [
      //        'lcovonly',
      //        {
      //          file: 'coverage.lcov',
      //        },
      //      ],
      //      // Log a coverage summary at the end of the test run
      //      [
      //        'text-summary',
      //        {
      //          file: null,
      //        },
      //      ],
      //    ],
      //    // Configure watermarks, see https://github.com/istanbuljs/nyc#high-and-low-watermarks
      //    // watermarks: {},
      //    rewritePath: ({ absolutePath, relativePath }: any) => {
      //      return absolutePath.replace('webpack:', '');
      //    },
      //  },
      //],
    ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4200',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    /*
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },*/

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run start',
    port: 4200,
    timeout: 120 * 1000,
    reuseExistingServer: true
  },
};

export default config;
