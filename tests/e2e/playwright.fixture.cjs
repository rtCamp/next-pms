const { test: base, expect, devices } = require("@playwright/test");
const path = require("path");
const fs = require("fs").promises;
const { storeStorageState } = require("./helpers/storageStateHelper");

// Define the single shared JSON directory
const SHARED_JSON_DIR = path.resolve(__dirname, "data", "json-files");
// ------------------------------------------------------------------------------------------

/**
 * True when the stored state still carries a `sid` the browser will actually send.
 *
 * Playwright drops an expired cookie while restoring a storageState, so an
 * expired `sid` leaves the context holding only the session cookies (`user_id`,
 * `full_name`, ...). The very first navigation then goes out as Guest, the app
 * redirects to /login, and the test times out after 30s waiting for an element
 * that will never render - which reads as a selector or timing bug, not an auth
 * one. The file existing tells you nothing: `sid` expires roughly 12 hours after
 * it is written, so the first run of the next day inherits a dead state.
 *
 * Checked here rather than in globalSetup because these are per-worker files and
 * only the worker knows its own index.
 */
const hasUsableSession = async (filePath) => {
  try {
    const state = JSON.parse(await fs.readFile(filePath, "utf-8"));
    const sid = (state.cookies || []).find((c) => c.name === "sid");
    if (!sid) return false;
    // -1 marks a true session cookie: it lives as long as the browser context.
    if (sid.expires === -1 || sid.expires == null) return true;
    // Re-login a few minutes early rather than racing the expiry mid-run.
    return sid.expires * 1000 > Date.now() + 5 * 60 * 1000;
  } catch {
    return false;
  }
};

const test = base.extend({
  // Worker-scoped fixture: generate a unique storageState per role per worker
  authState: [
    async ({}, use, testInfo) => {
      const role = testInfo.project.metadata.TEST_ROLE;
      if (!role) {
        throw new Error("`metadata.TEST_ROLE` must be set on the project");
      }

      const workerIndex = testInfo.workerIndex;
      const fileName = `${role}-w${workerIndex}.json`;
      const outPath = path.resolve(__dirname, "./auth", fileName);

      if (!(await hasUsableSession(outPath))) {
        console.log(
          `🔐 Refreshing auth state for ${role} (worker ${workerIndex}) - no usable session on disk.`,
        );
        // Generate storage state with CSRF (isApi=false)
        await storeStorageState(role, false, outPath);
      }

      await use(outPath);
    },
    { scope: "worker" },
  ],

  // Fixed JSON directory - same for all workers
  jsonDir: [
    async ({}, use) => {
      // Verify directory exists (should be created in global setup)
      try {
        await fs.access(SHARED_JSON_DIR);
      } catch {
        console.error("❌ JSON directory missing - was global setup run?");
        throw new Error(
          "JSON directory not found. Ensure global setup has run.",
        );
      }

      await use(SHARED_JSON_DIR);
    },
    { scope: "worker" },
  ],

  // Override built-in storageState to use our worker-scoped authState
  storageState: async ({ authState }, use) => {
    await use(authState);
  },
});

module.exports = { test, expect, devices };
