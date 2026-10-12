// CI wrapper around playwright.config.js: same projects/setup, but a lean HTML report.
// Used by .github/workflows/e2e-tests.yml (the QE workflow keeps the Allure reporters).
const base = require("./playwright.config.js");

module.exports = {
  ...base,
  // The config stops CI runs after 5 failures; this run should report everything.
  maxFailures: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "results.json" }],
  ],
  // Failure traces and screenshots stay; videos are what made the report huge.
  use: { ...base.use, video: "off" },
};
