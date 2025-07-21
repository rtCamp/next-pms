import { request } from "@playwright/test";
import path from "path";
import fs from "fs";
import config from "../../playwright.config";

const baseURL = config.use?.baseURL;
// ------------------------------------------------------------------------------------------

/**
 * Load the storage state for a given role.
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
 * Reusable API request wrapper.
 */
export const apiRequest = async (endpoint, options = {}, role = "manager") => {
  const authFilePath = loadAuthState(role);
  const requestContext = await request.newContext({ baseURL, storageState: authFilePath });

  const response = await requestContext.fetch(endpoint, {
    ...options,
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    postData: options.data ? JSON.stringify(options.data) : undefined,
  });

  if (!response.ok()) {
    await requestContext.dispose();
    throw new Error(`API request failed for ${role} at ${endpoint}: ${response.status()} ${response.statusText()}`);
  }

  const data = await response.json();
  await requestContext.dispose();
  return data;
};

// ------------------------------------------------------------------------------------------

/**
 * Creates a leave application.
 */
export const createLeave = async ({ employee, from_date, to_date, description }, role = "manager") => {
  return await apiRequest(
    `/api/resource/Leave Application`,
    {
      method: "POST",
      data: {
        employee,
        from_date,
        to_date,
        description,
      },
    },
    role
  );
};

// ------------------------------------------------------------------------------------------

/**
 * Approves or rejects a leave application.
 */
export const actOnLeave = async ({ action, leaveDetails }, role = "manager") => {
  return await apiRequest(
    `/api/method/frappe.model.workflow.apply_workflow`,
    {
      method: "POST",
      data: {
        doc: leaveDetails,
        action,
      },
    },
    role
  );
};

// ------------------------------------------------------------------------------------------

/**
 * Retrieves leave applications with filters.
 */
export const getLeaves = async (filters, role = "manager") => {
  const endpoint = `/api/resource/Leave Application?fields=["*"]&filters=${encodeURIComponent(
    JSON.stringify(filters)
  )}`;
  return await apiRequest(endpoint, {}, role);
};

// ------------------------------------------------------------------------------------------

/**
 * Retrieves a single leave application's details.
 */
export const getLeaveDetails = async (name, role = "manager") => {
  return await apiRequest(`/api/resource/Leave Application/${name}`, {}, role);
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes leave of an employee
 */
export const deleteLeave = async (leaveID, role = "admin") => {
  return apiRequest(
    `/api/resource/Leave Application/${leaveID}`,
    {
      method: "DELETE",
    },
    role
  );
};
