import { request } from "@playwright/test";
import { baseURL, loadAuthState, fetchWithRetry, deleteDocument } from "./apiClient";

/**
 * Reusable API request wrapper.
 */
export const apiRequest = async (endpoint, options = {}, role = "manager") => {
  const authFilePath = loadAuthState(role);
  const requestContext = await request.newContext({ baseURL, storageState: authFilePath });

  const response = await fetchWithRetry(requestContext, endpoint, {
    timeout: 120000,
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
  return await deleteDocument("Leave Application", leaveID, role);
};
