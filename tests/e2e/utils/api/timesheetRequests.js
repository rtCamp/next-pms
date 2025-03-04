import { request } from "@playwright/test";

// Load env variables
const repManEmail = process.env.REP_MAN_EMAIL;
const repManPass = process.env.REP_MAN_PASS;

let context; // Global request context to maintain session

/**
 * Login to the system and create a new request context.
 */
export const login = async () => {
  // Create new request context
  context = await request.newContext();

  const response = await context.post(`/login`, {
    data: {
      cmd: "login",
      usr: repManEmail,
      pwd: repManPass,
    },
  });

  return await response;
};

/**
 * Create a new timesheet entry.
 */
export const createTimesheet = async ({ task, description, hours, date, employee }) => {
  // Ensure the user is logged in before making API requests
  if (context === undefined || context === null) {
    await login();
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

  return await response;
};

/**
 * Delete a timesheet entry.
 */
export const deleteTimesheet = async ({ parent, name }) => {
  // Ensure the user is logged in before making API requests
  if (context === undefined || context === null) {
    await login();
  }

  const response = await context.post(`/api/method/next_pms.timesheet.api.timesheet.delete`, {
    data: {
      parent: parent,
      name: name,
    },
  });

  return await response;
};

/**
 * Get timesheet details for the specified employee.
 * Optional params: start_date, max_week.
 */
export const getTimesheetDetails = async ({ employee, start_date, max_week }) => {
  // Ensure the user is logged in before making API requests
  if (context === undefined || context === null) {
    await login();
  }

  // Build query string dynamically based on provided parameters
  const queryParams = new URLSearchParams({ employee });

  if (start_date) queryParams.append("start_date", start_date);
  if (max_week) queryParams.append("max_week", max_week);

  // Fetch timesheet details
  const response = await context.get(
    `/api/method/next_pms.timesheet.api.timesheet.get_timesheet_data?${queryParams.toString()}`
  );

  return await response;
};
