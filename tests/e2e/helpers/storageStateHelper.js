import path from "path";
import { request } from "@playwright/test";
import config from "../playwright.config";
import { loginIntoNextPMS } from "../utils/api/authRequestForStorage";

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
 * Uses API login instead of UI login.
 */
export const storeStorageState = async (role) => {
  const email = role === "employee" ? empEmail : manEmail;
  const password = role === "employee" ? empPass : manPass;

  const requestContext = await request.newContext({ baseURL });

  // Perform login using API
  const response = await loginIntoNextPMS(requestContext, email, password);

  if (!response.ok()) {
    throw new Error(`Login failed for ${role}: ${response.status()} ${response.statusText()}`);
  }

  // Store the authentication storage state
  await requestContext.storageState({ path: path.resolve(__dirname, `../auth/${role}.json`) });

  // Close request context
  await requestContext.dispose();
};

export const storeStorageStateforAPI = async (role) => {
  const email = role === "employee" ? empEmail : manEmail;
  const password = role === "employee" ? empPass : manPass;

  const requestContext = await request.newContext({ baseURL });

  // Perform login using API
  const response = await loginIntoNextPMS(requestContext, email, password);

  if (!response.ok()) {
    throw new Error(`Login failed for ${role}-API: ${response.status()} ${response.statusText()}`);
  }

  // Store the authentication storage state
  await requestContext.storageState({ path: path.resolve(__dirname, `../auth/${role}-API.json`) });

  // Close request context
  await requestContext.dispose();
};
