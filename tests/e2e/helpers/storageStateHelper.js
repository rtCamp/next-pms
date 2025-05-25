import path from "path";
import { request, chromium } from "@playwright/test";
import config from "../playwright.config";
import { loginIntoNextPMS } from "../utils/api/authRequestForStorage";

// Load config variables
const baseURL = config.use?.baseURL;

// Load env variables
const empEmail = process.env.EMP_EMAIL;
const empPass = process.env.EMP_PASS;
const emp2Email = process.env.EMP2_EMAIL;
const emp2Pass = process.env.EMP2_PASS;
const emp3Email = process.env.EMP3_EMAIL;
const emp3Pass = process.env.EMP3_PASS;
const manEmail = process.env.REP_MAN_EMAIL;
const manPass = process.env.REP_MAN_PASS;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPass = process.env.ADMIN_PASS;

/**
 * Stores the authentication state of a specified role for reuse in tests.
 * Uses API login instead of UI login. When isApi=false, it also
 * fetches a CSRF token cookie via a browser context before saving.
 */
export const storeStorageState = async (role, isApi = false) => {
  const credentialsMap = {
    employee: { email: empEmail, password: empPass },
    employee2: { email: emp2Email, password: emp2Pass },
        employee3: { email: emp3Email, password: emp3Pass },
    manager: { email: manEmail, password: manPass },
    admin: { email: adminEmail, password: adminPass },
  };

  const { email, password } = credentialsMap[role];
  const requestContext = await request.newContext({ baseURL });

  // Perform login using API
  const response = await loginIntoNextPMS(requestContext, email, password);
  if (!response.ok()) {
    throw new Error(`Login failed for ${role}: ${response.status()} ${response.statusText()}`);
  }

  // If front-end (UI) state is requested, include CSRF cookie
  if (!isApi) {
    // Extract cookies from API context
    const { cookies } = await requestContext.storageState();

    // Spin up a browser context to fetch CSRF token
    const browser = await chromium.launch();
    const context = await browser.newContext({ baseURL });

    // Seed context with API cookies (session cookie)
    await context.addCookies(cookies);
    const page = await context.newPage();

    // Navigate to application to let server set CSRF token cookie
    await page.goto(baseURL);

    // Save combined authentication + CSRF state
    await context.storageState({ path: path.resolve(__dirname, `../auth/${role}.json`) });
    await browser.close();
  } else {
    // Store API-only state
    await requestContext.storageState({ path: path.resolve(__dirname, `../auth/${role}-API.json`) });
  }

  // Clean up
  await requestContext.dispose();
};
