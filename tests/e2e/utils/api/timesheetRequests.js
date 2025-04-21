import { login } from "./authRequests";

let context; // Global variable for request context

// ------------------------------------------------------------------------------------------

/**
 * Create a new timesheet entry.
 */
export const createTimesheet = async ({ task, description, hours, date, employee }) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  const response = await context.post(`/api/method/next_pms.timesheet.api.timesheet.save`, {
    data: {
      task: task,
      description: description,
      hours: hours,
      date: date,
      employee: employee,
    },
  });
  if (!response.ok()) {
    throw new Error(`Failed to create timesheet for task: ${task}. Status: ${response.status()}`);
  }

  return response;
};

// ------------------------------------------------------------------------------------------

/**
 * Delete a timesheet entry.
 */
export const deleteTimesheetbyID = async ({ timesheetID }) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  const response = await context.delete(`/api/resource/Timesheet/${timesheetID}`, {});
  if (!response.ok()) {
    throw new Error(`Failed to delete timesheet for ID: ${timesheetID}. Status: ${response.status()}`);
  }

  return response;
};

export const deleteTimesheet = async ({ parent, name }) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  const response = await context.post(`/api/method/next_pms.timesheet.api.timesheet.delete`, {
    data: {
      parent: parent,
      name: name,
    },
  });

  return response;
};

// ------------------------------------------------------------------------------------------

/**
 * Get timesheet details for the specified employee.
 * Optional params: start_date, max_week.
 */
export const getTimesheetDetails = async ({ employee, start_date, max_week }) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  // Build query string dynamically based on provided parameters
  const queryParams = new URLSearchParams({ employee });

  if (start_date) queryParams.append("start_date", start_date);
  if (max_week) queryParams.append("max_week", max_week);

  // Fetch timesheet details
  const response = await context.get(
    `/api/method/next_pms.timesheet.api.timesheet.get_timesheet_data?${queryParams.toString()}`
  );

  return response;
};
