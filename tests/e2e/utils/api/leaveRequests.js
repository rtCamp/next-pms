import { login } from "./authRequests";

let context; // Global variable for request context

// ------------------------------------------------------------------------------------------

/**
 * Creates a leave application for an employee.
 */
export const createLeave = async ({ employee, from_date, to_date, description }) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  const response = await context.post(`/api/resource/Leave%20Application`, {
    data: {
      employee: employee,
      from_date: from_date,
      to_date: to_date,
      description: description,
    },
  });
  if (!response.ok()) {
    throw new Error(
      `Failed to get response for Create Leave with description: ${description}. Status: ${response.status()}`
    );
  }

  return response;
};

// ------------------------------------------------------------------------------------------

/**
 * Approves or rejects a leave application.
 */
export const actOnLeave = async ({ action, leaveDetails }) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  const response = await context.post(`/api/method/frappe.model.workflow.apply_workflow`, {
    data: {
      doc: leaveDetails,
      action: action,
    },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to get response for Act on Leave for action: ${action} and leave detials ${leaveDetails}. Status: ${response.status()}`
    );
  }

  return response;
};

// ------------------------------------------------------------------------------------------

/**
 * Retrieves leave applications with specified filters.
 */
export const getLeaves = async (filters) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  const endpoint = `/api/resource/Leave%20Application?fields=["*"]&filters=${encodeURIComponent(
    JSON.stringify(filters)
  )}`;

  // Fetch leave applications
  const response = await context.get(endpoint);

  if (!response.ok()) {
    throw new Error(`Failed to get leaves for filters: ${filters}. Status: ${response.status()}`);
  }
  return response;
};

// ------------------------------------------------------------------------------------------

/**
 * Retrieves details of a specified leave.
 */
export const getLeaveDetails = async (name) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  const response = await context.get(`/api/resource/Leave%20Application/${name}`);

  if (!response.ok()) {
    throw new Error(`Failed to get leave details for: ${name}. Status: ${response.status()}`);
  }

  return response;
};
