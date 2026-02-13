// @ts-check
const { defineConfig, devices } = require("@playwright/test");
import path from "path";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require("dotenv").config({ path: path.resolve(__dirname, "../e2e/.env") });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },

  /* Directory with specs */
  testDir: "./specs",

  /* Test results directory */
  outputDir: "test-results",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry logic for failed tests */
  retries: process.env.CI ? 2 : 0, // Retry twice on CI, no retries locally

  /* Configure the number of workers for parallel execution */
  workers: process.env.CI ? 1 : undefined, // Use 4 workers on CI, defaults to the number of CPU cores otherwise

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "results.json" }],
    ["list"],
    [
      "allure-playwright",
      {
        resultsDir: "allure-results",
        detail: true,
      },
    ],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL,

    /* Collect trace */
    trace: "retain-on-failure",

    /* Capture screenshot */
    screenshot: "only-on-failure",

    /* Record video */
    video: "retain-on-failure",

    launchOptions: {
      slowMo: 500, // Slow down tests by 500ms
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 720 },
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
