import { request } from "@playwright/test";
import path from "path";
import fs from "fs";
import config from "../../playwright.config";

// Load config variables
const baseURL = config.use?.baseURL;
/**
 * Helper function to ensure storage state is loaded for respective roles.
 */
const loadAuthState = (role) => {
  const filePath = path.resolve(__dirname, `../../auth/${role}-API.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Auth state file for ${role} not found: ${filePath}`);
  }
  return filePath;
};
/**
 * Helper function to load build the API request
 */
export const apiRequest = async (endpoint, options = {}, role = "manager") => {
  const authFilePath = loadAuthState(role);
  const requestContext = await request.newContext({ baseURL, storageState: authFilePath });
  const response = await requestContext.fetch(endpoint, {
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
    //console.warn(`Endpoint type: ${options.data} successfully done for enpoint: ${endpoint}`)
  } else {
    await requestContext.dispose();
    throw new Error(
      `API request failed for ${role} and endpoint ${endpoint}: ${response.status()} ${response.statusText()}`
    );
  }

  await requestContext.dispose();
  return responseData;
};
/**
 * Create a new Task.
 */
export const createTask = async ({ subject, project, description, custom_is_billable }) => {
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
/**
 * Delete a Task.
 */
export const deleteTask = async (taskID) => {
  return await apiRequest(`/api/resource/Task/${taskID}`, {
    method: "DELETE",
  });
};
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
    role
  );
};
/**
 * Get Task Details.
 */
export const getTaskDetails = async (taskID) => {
  return await apiRequest(`/api/resource/Task/${taskID}`, {
    method: "GET",
  });
};
