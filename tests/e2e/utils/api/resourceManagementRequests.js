import { request } from "@playwright/test";
import { baseURL, loadAuthState, fetchWithRetry, deleteWithLockRetry, deleteDocument } from "./apiClient";

/**
 * Fire off an API request using Playwright’s requestContext + storageState.
 * Automatically JSON‑stringifies data, sets headers, and throws on non‑ok.
 */
export const apiRequest = async (endpoint, options = {}, role = "manager") => {
  const authFilePath = loadAuthState(role);
  const ctx = await request.newContext({ baseURL, storageState: authFilePath });

  const response = await fetchWithRetry(ctx, endpoint, {
    timeout: 120000,
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
  const result = await apiRequest(
    "/api/resource/Resource%20Allocation",
    {
      method: "POST",
      data: payload,
    },
    "manager"
  );
  return result;
};
// ------------------------------------------------------------------------------------------

/**
 * Delete a Resource Allocation by its ID.
 */
export const deleteAllocation = async (allocationId) => {
  return await deleteWithLockRetry(() => deleteDocument("Resource Allocation", allocationId, "admin"), {
    label: `Resource Allocation ${allocationId}`,
  });
};
