import { request } from "@playwright/test";
import config from "../../playwright.config";

// Load config variables
const baseURL = config.use?.baseURL;

// Load env variables
const repManEmail = process.env.REP_MAN_EMAIL;
const repManPass = process.env.REP_MAN_PASS;

let context; // Global request context to maintain session

// ------------------------------------------------------------------------------------------

/**
 * Login to the system and create a new request context.
 */
export const login = async () => {
  // Create new request context
  context = await request.newContext({ baseURL: baseURL });

  const response = await context.post(`/login`, {
    data: {
      cmd: "login",
      usr: repManEmail,
      pwd: repManPass,
    },
  });

  return await response;
};

// ------------------------------------------------------------------------------------------

/**
 * Creates a leave application for an employee.
 */
export const createLeave = async ({ employee, from_date, to_date, description }) => {
  // Ensure the user is logged in before making API requests
  if (context === undefined || context === null) {
    await login();
  }

  const response = await context.post(`/api/resource/Leave%20Application`, {
    data: {
      employee: employee,
      from_date: from_date,
      to_date: to_date,
      description: description,
    },
  });

  return await response;
};

// ------------------------------------------------------------------------------------------

/**
 * Approves or rejects a leave application.
 */
export const actOnLeave = async ({ action, leaveDetails }) => {
  // Ensure the user is logged in before making API requests
  if (context === undefined || context === null) {
    await login();
  }

  const response = await context.post(`/api/method/frappe.model.workflow.apply_workflow`, {
    data: {
      doc: leaveDetails,
      action: action,
    },
  });

  return await response;
};

// ------------------------------------------------------------------------------------------

/**
 * Retrieves leave application details for a specific employee and date range.
 */
export const getLeaveDetails = async ({ employee, from_date, to_date }) => {
  // Ensure the user is logged in before making API requests
  if (context === undefined || context === null) {
    await login();
  }

  const response = await context.get(
    `/api/resource/Leave%20Application?fields=["*"]&filters={"employee":"${employee}","from_date":"${from_date}","to_date":"${to_date}"}`
  );

  return await response;
};
