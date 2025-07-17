// @ts-check
const { defineConfig, devices } = require("@playwright/test");
import path from "path";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  /* Global setup file */
  globalSetup: "./globals/globalSetup.js",

  /* Global teardown file */
  globalTeardown: "./globals/globalTeardown.js",

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
  workers: process.env.CI ? 7 : undefined, // Use 7 workers on CI, defaults to the number of CPU cores otherwise

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

  /* Configure projects for specs */
  projects: [
    {
      name: "employee-chromium",
      testDir: "./specs/employee",
      use: { ...devices["Desktop Chrome"] },
      metadata: { TEST_ROLE: "employee" },
    },
    {
      name: "employee2-chromium",
      testDir: "./specs/employee2",
      use: { ...devices["Desktop Chrome"] },
      metadata: { TEST_ROLE: "employee2" },
    },
    {
      name: "employee3-chromium",
      testDir: "./specs/employee3",
      use: { ...devices["Desktop Chrome"] },
      metadata: { TEST_ROLE: "employee3" },
    },
    {
      name: "manager-chromium",
      testDir: "./specs/manager",
      use: { ...devices["Desktop Chrome"] },
      metadata: { TEST_ROLE: "manager" },
    },
  ],

});
