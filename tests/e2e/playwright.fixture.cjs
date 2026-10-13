const { test: base, expect, devices, request } = require("@playwright/test");
const path = require("path");
const fs = require("fs").promises;
const {
  storeStorageState,
  credentialsMap,
} = require("./helpers/storageStateHelper");

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
 * An unexpired `sid` can still be dead on the server - logged out, or its user
 * deleted and re-created by the seed scripts - or belong to a user .env no
 * longer names, so the server is asked who it belongs to.
 *
 * Checked here rather than in globalSetup because these are per-worker files and
 * only the worker knows its own index.
 */
const hasUsableSession = async (filePath, baseURL, email) => {
  let state;
  try {
    state = JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    return false;
  }
  const sid = (state.cookies || []).find((c) => c.name === "sid");
  if (!sid || sid.value === "Guest") return false;
  // -1 marks a true session cookie: it lives as long as the browser context.
  // Otherwise re-login a few minutes early rather than racing the expiry mid-run.
  const unexpired =
    sid.expires === -1 ||
    sid.expires == null ||
    sid.expires * 1000 > Date.now() + 5 * 60 * 1000;
  if (!unexpired) return false;

  const context = await request.newContext({ baseURL, storageState: state });
  const response = await context.get("/api/method/frappe.auth.get_logged_user");
  const user = response.ok() ? (await response.json()).message : null;
  await context.dispose();
  return user === email;
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

      const { email } = credentialsMap[role];
      if (!(await hasUsableSession(outPath, process.env.BASE_URL, email))) {
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
