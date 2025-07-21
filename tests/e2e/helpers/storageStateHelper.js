// storageStateHelper.js
import path from "path";
import { request, chromium } from "@playwright/test";
import config from "../playwright.config";
import { loginIntoNextPMS } from "../utils/api/authRequestForStorage";
import fs from "fs";

// Base URL from Playwright config
const baseURL = config.use?.baseURL;

// Environment credentials
const credentialsMap = {
  employee: { email: process.env.EMP_EMAIL, password: process.env.EMP_PASS },
  employee2: { email: process.env.EMP2_EMAIL, password: process.env.EMP2_PASS },
  employee3: { email: process.env.EMP3_EMAIL, password: process.env.EMP3_PASS },
  manager: { email: process.env.REP_MAN_EMAIL, password: process.env.REP_MAN_PASS },
  admin: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASS },
};

/**
 * Stores the authentication state of a specified role for reuse in tests.
 * @param {string} role            Role key must exist in credentialsMap
 * @param {boolean} [isApi=false]  If true, only API tokens are stored; otherwise includes CSRF cookie too
 * @param {string} [outFilePath]   Optional full path to write storageState JSON
 */
export const storeStorageState = async (role, isApi = false, outFilePath) => {
  // Validate role
  const creds = credentialsMap[role];
  if (!creds) {
    throw new Error(`Unknown role "${role}". Expected one of: ${Object.keys(credentialsMap).join(", ")}`);
  }
  const { email, password } = creds;

  // Determine output path
  const defaultName = isApi ? `${role}-API.json` : `${role}.json`;
  const storagePath = outFilePath ? outFilePath : path.resolve(__dirname, `../auth/${defaultName}`);

  // Ensure output directory exists
  const dir = path.dirname(storagePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create API request context
  const requestContext = await request.newContext({ baseURL });

  // Perform login via API
  const response = await loginIntoNextPMS(requestContext, email, password);
  if (!response.ok()) {
    throw new Error(`Login failed for ${role}: ${response.status()} ${response.statusText()}`);
  }

  if (isApi) {
    // Store API-only context
    await requestContext.storageState({ path: storagePath });
  } else {
    // Fetch cookies from API context
    const { cookies } = await requestContext.storageState();

    // Launch browser to capture CSRF token
    const browser = await chromium.launch();
    const context = await browser.newContext({ baseURL });

    // Seed context with API session cookies
    await context.addCookies(cookies);
    const page = await context.newPage();
    await page.goto(baseURL);

    // Save combined state (session + CSRF)
    await context.storageState({ path: storagePath });
    await browser.close();
  }

  // Clean up request context
  await requestContext.dispose();
};
