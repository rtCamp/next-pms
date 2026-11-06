// storageStateHelper.js
import path from "path";
import { request, chromium } from "@playwright/test";
import config from "../playwright.config";
import { loginIntoNextPMS } from "../utils/api/authRequestForStorage";
import { scaleTimeout } from "../utils/timeouts";
import fs from "fs";

// Base URL from Playwright config
const baseURL = config.use?.baseURL;

let sessionCount = 0;

// Environment credentials
const credentialsMap = {
  employee: { email: process.env.EMP_EMAIL, password: process.env.EMP_PASS },
  employee2: { email: process.env.EMP2_EMAIL, password: process.env.EMP2_PASS },
  employee3: { email: process.env.EMP3_EMAIL, password: process.env.EMP3_PASS },
  manager: {
    email: process.env.REP_MAN_EMAIL,
    password: process.env.REP_MAN_PASS,
  },
  admin: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASS },
};

/**
 * Stores the authentication state of a specified role for reuse in tests.
 * @param {string | {email: string, password: string}} role  Role key in credentialsMap, or the credentials of a seeded user (then `outFilePath` is required)
 * @param {boolean} [isApi=false]  If true, only API tokens are stored; otherwise includes CSRF cookie too
 * @param {string} [outFilePath]   Optional full path to write storageState JSON
 */
export const storeStorageState = async (role, isApi = false, outFilePath) => {
  // Validate role
  const creds = typeof role === "string" ? credentialsMap[role] : role;
  if (!creds) {
    throw new Error(
      `Unknown role "${role}". Expected one of: ${Object.keys(credentialsMap).join(", ")}`,
    );
  }
  if (typeof role !== "string" && !outFilePath) {
    throw new Error("Credentials need an outFilePath to store their state in");
  }
  const { email, password } = creds;

  // Determine output path
  const defaultName = isApi ? `${role}-API.json` : `${role}.json`;
  const storagePath = outFilePath
    ? outFilePath
    : path.resolve(__dirname, `../auth/${defaultName}`);

  // Ensure output directory exists
  const dir = path.dirname(storagePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const requestContext = await request.newContext({ baseURL });
  // Written aside and renamed, so a worker reading the file never sees half of it.
  const tmpPath = `${storagePath}.${process.pid}.tmp`;
  let browser;
  try {
    // Perform login via API
    const response = await loginIntoNextPMS(requestContext, email, password);
    if (!response.ok()) {
      throw new Error(
        `Login failed for ${role}: ${response.status()} ${response.statusText()}`,
      );
    }

    if (isApi) {
      // Store API-only context
      await requestContext.storageState({ path: tmpPath });
    } else {
      // Fetch cookies from API context
      const { cookies } = await requestContext.storageState();

      // Launch browser to capture CSRF token
      browser = await chromium.launch();
      const context = await browser.newContext({ baseURL });

      // Seed context with API session cookies
      await context.addCookies(cookies);
      const page = await context.newPage();
      await page.goto(baseURL, { timeout: scaleTimeout(30000) });

      // Save combined state (session + CSRF)
      await context.storageState({ path: tmpPath });
    }
    fs.renameSync(tmpPath, storagePath);
  } finally {
    // A failed attempt must not leave a browser running or a stray temp file.
    await browser?.close();
    await requestContext.dispose();
    fs.rmSync(tmpPath, { force: true });
  }
};

/**
 * A browser context signed in as a seeded user, so the shared accounts' sessions stay
 * untouched. Its session file is removed when the context closes.
 * @param {import('@playwright/test').Browser} browser
 * @param {{email: string, password: string}} user
 * @param {string} name  Prefix of the session file's name
 */
export const signedInContext = async (browser, user, name) => {
  // One file per call: the same name is used by cases that run in parallel, and one case's
  // cleanup would otherwise remove the file another has just written.
  const file = path.resolve(
    __dirname,
    `../auth/${name}-${process.pid}-${Date.now()}-${sessionCount++}.json`,
  );
  await storeStorageState(user, false, file);
  const context = await browser.newContext({
    baseURL: process.env.BASE_URL,
    storageState: file,
  });
  context.on("close", () => fs.promises.rm(file, { force: true }));
  return context;
};

/**
 * A browser context signed in as a shared role, from a session of its own, so it never
 * depends on the role's shared file having been written yet.
 * @param {import('@playwright/test').Browser} browser
 * @param {string} role  Key in credentialsMap
 */
export const signedInAsRole = (browser, role) =>
  signedInContext(browser, credentialsMap[role], `${role}-own`);
