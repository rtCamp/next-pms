import { request } from "@playwright/test";
import {
  baseURL,
  loadAuthState,
  fetchWithRetry,
  deleteWithLockRetry,
  deleteDocument,
} from "./apiClient";

/**
 * Helper function to load build the API request
 */
export const apiRequest = async (endpoint, options = {}, role = "manager") => {
  const authFilePath = loadAuthState(role);
  const requestContext = await request.newContext({
    baseURL,
    storageState: authFilePath,
  });
  const response = await fetchWithRetry(requestContext, endpoint, {
    timeout: 120000,
    ...options,
    postData: options.data ? JSON.stringify(options.data) : undefined, // Transform to json format
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let responseData;
  if (response.ok()) {
    responseData = await response.json();
  } else {
    // Include the body: Frappe puts the actual reason (row lock, LinkExistsError,
    // permission) in there, and without it every failure reads as a bare 500.
    const text = await response.text().catch(() => "");
    await requestContext.dispose();
    throw new Error(
      `API request failed for ${role} and endpoint ${endpoint}: ${response.status()} ${response.statusText()}\n${text}`,
    );
  }

  await requestContext.dispose();
  return responseData;
};
// ------------------------------------------------------------------------------------------

/**
 * Create a new Task.
 */
export const createTask = async ({
  subject,
  project,
  description,
  custom_is_billable,
}) => {
  return await apiRequest("/api/resource/Task", {
    method: "POST",
    data: {
      subject,
      project,
      description,
      ...(custom_is_billable !== undefined && { custom_is_billable }),
    },
  });
};
// ------------------------------------------------------------------------------------------

/**
 * Delete a Task.
 */
export const deleteTask = async (taskID, role = "admin") => {
  return await deleteWithLockRetry(() => deleteDocument("Task", taskID, role), {
    label: `Task ${taskID}`,
  });
};
// ------------------------------------------------------------------------------------------

/**
 * Like a Task.
 */
export const likeTask = async (taskID, role = "manager") => {
  return await apiRequest(
    "/api/method/frappe.desk.like.toggle_like",
    {
      method: "POST",
      data: {
        doctype: "Task",
        name: taskID,
        add: "Yes",
      },
    },
    role,
  );
};
// ------------------------------------------------------------------------------------------

/**
 * Get Task Details.
 */
export const getTaskDetails = async (taskID) => {
  return await apiRequest(`/api/resource/Task/${taskID}`, {
    method: "GET",
  });
};
// ------------------------------------------------------------------------------------------

/**
 * Update a task detail
 */
export const updateTask = async (taskID, { custom_is_billable }) => {
  return await apiRequest(`/api/resource/Task/${taskID}`, {
    method: "PUT",
    data: {
      custom_is_billable: custom_is_billable,
    },
  });
};
