import path from "path";
import config from "../playwright.config";
import { chromium } from "@playwright/test";
import { loginNextPMS } from "./loginHelper";

// Load config variables
const baseURL = config.use?.baseURL;

// Load env variables
const empEmail = process.env.EMP_EMAIL;
const empPass = process.env.EMP_PASS;

const authFilePath = "..//auth/user.json";

// ------------------------------------------------------------------------------------------

/**
 * Stores the authentication state for reuse in tests.
 * It launches a browser, logs in, and saves the storage state.
 */
export const storeStorageState = async () => {
  // Launch a new browser instance
  const browser = await chromium.launch({ slowMo: 500 });

  // Create a new browser context with the base URL set
  const context = await browser.newContext({ baseURL: baseURL });

  // Create a new page within the context
  const page = await context.newPage();

  // Perform login using provided credentials
  await loginNextPMS(page, empEmail, empPass);

  // Save the authentication storage state for future test sessions
  await context.storageState({ path: path.resolve(__dirname, authFilePath) });

  // Close the browser to free up resources
  await browser.close();
};
