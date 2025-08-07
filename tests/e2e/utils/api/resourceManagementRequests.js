import { request } from "@playwright/test";
import path from "path";
import fs from "fs";
import config from "../../playwright.config";

// Base URL from config
const baseURL = config.use?.baseURL;
// ------------------------------------------------------------------------------------------

/**
 * Ensure the storage‑state file for the given role exists, and return its path.
 */
const loadAuthState = (role) => {
  const filePath = path.resolve(__dirname, `../../auth/${role}-API.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Auth state file for ${role} not found: ${filePath}`);
  }
  return filePath;
};
// ------------------------------------------------------------------------------------------

/**
 * Fire off an API request using Playwright’s requestContext + storageState.
 * Automatically JSON‑stringifies data, sets headers, and throws on non‑ok.
 */
export const apiRequest = async (endpoint, options = {}, role = "manager") => {
  const authFilePath = loadAuthState(role);
  const ctx = await request.newContext({ baseURL, storageState: authFilePath });

  const response = await ctx.fetch(endpoint, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    data: options.data,
  });

  const status = response.status();
  const statusText = response.statusText();

  if (!response.ok()) {
    let errorBody;
    try {
      errorBody = await response.json();
      console.error("API Error Details:", errorBody);
    } catch {
      errorBody = await response.text();
      console.error("API Error (non-JSON) Details:", errorBody);
    }
    await ctx.dispose();
    throw new Error(
      `API request failed for ${role} @ ${endpoint} in the resource management with status as: ${status} ${statusText}. Error body: ${JSON.stringify(
        errorBody
      )}`
    );
  }

  const json = await response.json();
  await ctx.dispose();
  return json;
};

// ------------------------------------------------------------------------------------------

/**
 * Create a new Project entry.
 */
export const createAllocation = async (payload) => {
  //console.log("Payload received in create allocation is:", payload);
  const result = await apiRequest(
    "/api/resource/Resource%20Allocation",
    {
      method: "POST",
      data: payload,
    },
    "manager"
  );
  //console.log("Result of create allocation is: ", result);
  return result;
};
// ------------------------------------------------------------------------------------------

/**
 * Delete a Resource Allocation by its ID.
 */
export const deleteAllocation = async (allocationId) => {
  return await apiRequest(`/api/resource/Resource%20Allocation/${allocationId}`, { method: "DELETE" }, "admin");
};
