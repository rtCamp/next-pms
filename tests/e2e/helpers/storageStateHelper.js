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
const adminEmail = process.env.ADMIN_EMAIL;
const adminPass = process.env.ADMIN_PASS;
// ------------------------------------------------------------------------------------------

/**
 * Stores the authentication state of a specified role for reuse in tests.
 * Uses API login instead of UI login.
 */
export const storeStorageState = async (role, isApi = false) => {
  const credentialsMap = {
    employee: { email: empEmail, password: empPass },
    manager: { email: manEmail, password: manPass },
    admin: { email: adminEmail, password: adminPass }
  };

  const { email, password } = credentialsMap[role];

  const requestContext = await request.newContext({ baseURL });

  // Perform login using API
  const response = await loginIntoNextPMS(requestContext, email, password);

  if (!response.ok()) {
    throw new Error(`Login failed for ${role}: ${response.status()} ${response.statusText()}`);
  }

  if (!isApi) {
    // Store the authentication storage state
    await requestContext.storageState({ path: path.resolve(__dirname, `../auth/${role}.json`) });
  } else {
    // Store the authentication storage state for the API
    await requestContext.storageState({ path: path.resolve(__dirname, `../auth/${role}-API.json`) });
  }

  // Close request context
  await requestContext.dispose();
};
