import { request } from "@playwright/test";
import path from "path";
import fs from "fs";
import config from "../../playwright.config";

// Load config variables
const baseURL = config.use?.baseURL;
// ------------------------------------------------------------------------------------------

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
// ------------------------------------------------------------------------------------------

/**
 * Helper function to load build the API request
 */
export const apiRequest = async (endpoint, options = {}, role = "manager") => {
  const authFilePath = loadAuthState(role);
  const requestContext = await request.newContext({
    baseURL,
    storageState: authFilePath,
  });

  const method = options.method || "GET";
  const postData = options.data ? JSON.stringify(options.data) : undefined;

  const response = await requestContext.fetch(endpoint, {
    ...options,
    method,
    postData,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let responseData;
  if (response.ok()) {
    responseData = await response.json();
    await requestContext.dispose();
    return responseData;
  } else {
    const responseBody = await response.text(); // Try reading as text for error details
    await requestContext.dispose();

    const debugInfo = {
      role,
      endpoint,
      method,
      status: `${response.status()} ${response.statusText()}`,
      payload: options.data || null,
      responseBody,
    };

    console.error("❌ API Request Debug Info:", JSON.stringify(debugInfo, null, 2));

    throw new Error(
      `API request failed:\n` +
        `  Role      : ${role}\n` +
        `  Endpoint  : ${endpoint}\n` +
        `  Method    : ${method}\n` +
        `  Status    : ${response.status()} ${response.statusText()}\n` +
        `  Payload   : ${postData || "N/A"}\n` +
        `  Response  : ${responseBody || "No response body"}\n\n` +
        `💡 Suggestion: Check if the endpoint is correct and accessible for the given role.\n`
    );
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Create a new timesheet entry.
 */
export const createTimesheet = async ({ task, description, hours, date, employee }, role = "manager") => {
  const endpoint = `/api/method/next_pms.timesheet.api.timesheet.save`;
  const options = {
    method: "POST",
    data: {
      task,
      description,
      hours,
      date,
      employee,
    },
  };
  return await apiRequest(endpoint, options, role);
};
// ------------------------------------------------------------------------------------------

/**
 * Delete a timesheet entry by Timesheet ID (resource API).
 */
export const deleteTimesheetbyID = async (timesheetID, role = "manager") => {
  const endpoint = `/api/resource/Timesheet/${timesheetID}`;
  const options = {
    method: "DELETE",
  };
  return await apiRequest(endpoint, options, role);
};
// ------------------------------------------------------------------------------------------

/**
 * Delete a timesheet entry using the custom delete method.
 */
export const deleteTimesheet = async ({ parent, name }, role = "manager") => {
  const endpoint = `/api/method/next_pms.timesheet.api.timesheet.delete`;
  const options = {
    method: "POST",
    data: {
      parent,
      name,
    },
  };
  return await apiRequest(endpoint, options, role);
};
// ------------------------------------------------------------------------------------------

/**
 * Get timesheet details for the specified employee.
 * Optional params: start_date, max_week.
 */
export const getTimesheetDetails = async ({ employee, start_date, max_week }, role = "manager") => {
  const queryParams = new URLSearchParams({ employee });

  if (start_date) queryParams.append("start_date", start_date);
  if (max_week) queryParams.append("max_week", max_week);

  const endpoint = `/api/method/next_pms.timesheet.api.timesheet.get_timesheet_data?${queryParams.toString()}`;
  const options = {
    method: "GET",
  };

  return await apiRequest(endpoint, options, role);
};
// ------------------------------------------------------------------------------------------

/**
 * Submit Timesheet for the specified employee.
 */
export const submitTimesheet = async ({ start_date, end_date, notes, approver, employee }, role) => {
  const endpoint = `/api/method/next_pms.timesheet.api.timesheet.submit_for_approval`;
  const options = {
    method: "POST",
    data: {
      start_date,
      end_date,
      notes,
      approver,
      employee,
    },
  };
  return await apiRequest(endpoint, options, role);
};
// ------------------------------------------------------------------------------------------

export const actOnTimesheet = async ({ dates, employee, note, status }, role = "manager") => {
  const endpoint = `/api/method/next_pms.timesheet.api.team.approve_or_reject_timesheet`;
  const options = {
    method: "POST",
    data: {
      dates,
      employee,
      note,
      status,
    },
  };

  return await apiRequest(endpoint, options, role);
};
