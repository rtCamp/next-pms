import path from "path";
import config from "../playwright.config";
import { chromium } from "@playwright/test";
import { loginNextPMS } from "./loginHelper";

// Load config variables
const baseURL = config.use?.baseURL;

// Load env variables
const empEmail = process.env.EMP_EMAIL;
const empPass = process.env.EMP_PASS;
const manEmail = process.env.REP_MAN_EMAIL;
const manPass = process.env.REP_MAN_PASS;

// ------------------------------------------------------------------------------------------

/**
 * Stores the authentication state of a specified role for reuse in tests.
 * It launches a browser, logs in, and saves the storage state.
 */
export const storeStorageState = async (role) => {
  // Launch a new browser instance
  const browser = await chromium.launch({ slowMo: 500 });

  // Create a new browser context with the base URL set
  const context = await browser.newContext({ baseURL: baseURL });

  // Create a new page within the context
  const page = await context.newPage();

  // Select login credentials based on role
  const email = role === "employee" ? empEmail : manEmail;
  const password = role === "employee" ? empPass : manPass;

  // Perform login using provided credentials
  await loginNextPMS(page, email, password);

  // Save the authentication storage state
  await context.storageState({ path: path.resolve(__dirname, `..//auth/${role}.json`) });

  // Close the browser to free up resources
  await browser.close();
};
