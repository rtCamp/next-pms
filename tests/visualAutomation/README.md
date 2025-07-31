# Visual Regression Testing with Playwright

This document provides an overview of the setup for visual regression testing setup for this project.

## Prerequisites

Ensure the following tools and dependencies are installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/next-pms-develop.git
   cd next-pms-develop/tests/visualAutomation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
3. Install playwright with browsers
   ```bash
   npx playwright install --with-deps
   ```

## Configuration

The configuration is set to run on Chrome, Firefox, and Webkit (Safari browser) with a default viewport size of 1280x720, which can be customized in the `tests/visualAutomation/playwright.config.js` file. The configuration uses the HTML, JSON, and Allure reports to output the results.

The configuration file `tests/visualAutomation/playwright.config.js` is pre-configured with default settings but can be updated as needed for custom requirements.

## Running Tests

To execute the visual regression tests, use the following command:

1. Run tests:
   ```bash
   npm run visual:test
   ```
2. Update screenshots:
   ```bash
   npm run visual:test:update
   ```
   This command updates the baseline screenshots by replacing them with the latest screenshots captured during the test run. Use this when changes to the UI are intentional.

## Debugging

If a test fails, screenshots of the baseline, actual, and diff images will be saved in the `tests/visualAutomation/test-results` directory for review.

## Folder Structure

```
tests/
    visualAutomation/
         README.md              # Documentation for visual regression testing
         playwright.config.js   # Playwright configuration file
         helpers/               # Directory containing all helper files for visual tests
         specs/                 # Directory for storing spec/test files
         test-results/          # Directory for test result outputs
                diff/               # Diff images for failed tests
                actual/             # Actual screenshots captured during tests
                baseline/           # Baseline screenshots for comparison
```

## Workflow how the tests are set to run in CI

1. Checks out the code
2. Sets up Node.js and installs dependencies
3. Installs Playwright browsers
4. Downloads existing snapshots from Hetzner S3
5. Runs visual tests
6. Uploads test results as artifacts
7. Updates snapshots and re-uploads them to S3

## Schedule & Manual Trigger

1. Runs Daily: 8:00 AM UTC via CRON
2. Manual Trigger: via GitHub Actions UI (workflow_dispatch)
   • Manual Trigger: via GitHub Actions UI (workflow_dispatch)
