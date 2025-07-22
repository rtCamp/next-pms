import { request } from "@playwright/test";
import path from "path";
import fs from "fs";
import config from "../../playwright.config";
import { deleteAllocationsByEmployee } from "../../helpers/employeeHelper";

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
    } catch (e) {
      errorBody = await response.text();
      console.error("API Error (non-JSON) Details:", errorBody);
    }
    await ctx.dispose();
    throw new Error(
      `API request failed for ${role} @ ${endpoint}: ${status} ${statusText}. Error body: ${JSON.stringify(errorBody)}`
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
export const createProject = async (payload) => {
  ////console.log("Payload received in create project is:", payload);
  const result = await apiRequest(
    "/api/resource/Project",
    {
      method: "POST",
      data: payload,
    },
    "admin"
  );
  ////console.log("Result of create project is: ", result);
  return result;
};
// ------------------------------------------------------------------------------------------

/**
 * Delete a Project entry.
 * On HTTP 417, fall back to deleting allocations first.
 */
export const deleteProject = async (projectId) => {
  try {
    await apiRequest(`/api/resource/Project/${projectId}`, { method: "DELETE" }, "admin");
  } catch (err) {
    // if the server signals “Expectation Failed” (417), clean up allocations
    if (err.message.includes("417")) {
      await deleteAllocationsByEmployee(projectId);
    } else {
      throw err;
    }
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Get details of a Project entry.
 */
export const getProjectDetails = async (projectId) => {
  return await apiRequest(`/api/resource/Project/${projectId}`, { method: "GET" }, "admin");
};
// ------------------------------------------------------------------------------------------

/**
 * Delete a Resource Allocation by its ID.
 */
export const deleteAllocation = async (allocationId) => {
  return await apiRequest(`/api/resource/Resource%20Allocation/${allocationId}`, { method: "DELETE" }, "admin");
};
