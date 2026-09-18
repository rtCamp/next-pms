import { request } from "@playwright/test";
import { baseURL, loadAuthState, fetchWithRetry, deleteWithLockRetry, deleteDocument } from "./apiClient";
import { deleteAllocationsByEmployee } from "../../helpers/employeeHelper";

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
  // Retry while the row is locked: teardown fires while the app is still
  // committing its own post-write hooks, and Frappe's delete uses NOWAIT.
  const { deleted, reason } = await deleteWithLockRetry(() => deleteDocument("Project", projectId, "admin"), {
    label: `Project ${projectId}`,
  });

  // A project still carrying allocations is refused with LinkExistsError.
  // Clear those and retry once - otherwise the project survives the run.
  if (!deleted && reason === "LinkExistsError") {
    await deleteAllocationsByEmployee(projectId);
    return await deleteWithLockRetry(() => deleteDocument("Project", projectId, "admin"), {
      label: `Project ${projectId} (retry after allocations)`,
    });
  }

  return { deleted, reason };
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
  return await deleteWithLockRetry(() => deleteDocument("Resource Allocation", allocationId, "admin"), {
    label: `Resource Allocation ${allocationId}`,
  });
};

// ------------------------------------------------------------------------------------------

/**
 * Create a saved view (PMS View Setting).
 *
 * Views are ordinary documents, so tests that need one as a precondition seed it
 * rather than depending on a view somebody created by hand on the environment.
 */
export const createView = async (payload) => {
  return await apiRequest(
    "/api/resource/PMS View Setting",
    {
      method: "POST",
      data: payload,
    },
    "admin"
  );
};
// ------------------------------------------------------------------------------------------

/**
 * Delete a saved view by its document name.
 */
export const deleteView = async (viewId) => {
  return await deleteDocument("PMS View Setting", viewId, "admin");
};

/**
 * Find saved views by their visible label.
 */
export const getViewsByLabel = async (label) => {
  const filters = encodeURIComponent(JSON.stringify([["label", "=", label]]));
  const fields = encodeURIComponent(JSON.stringify(["name", "label", "public"]));
  const result = await apiRequest(
    `/api/method/frappe.client.get_list?doctype=PMS View Setting&fields=${fields}&filters=${filters}&limit_page_length=0`,
    { method: "GET" },
    "admin"
  );

  return result?.message || result?.data?.message || [];
};
