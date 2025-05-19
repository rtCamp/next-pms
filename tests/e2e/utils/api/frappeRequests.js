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
 * Helper function to build and execute an API request.
 * Supports JSON (data) or form-encoded (form) payloads.
 */
export const apiRequest = async (endpoint, options = {}, role = "manager") => {
  const authFilePath = loadAuthState(role);
  const requestContext = await request.newContext({ baseURL, storageState: authFilePath });

  // Determine payload and headers
  let body;
  const headers = { ...(options.headers || {}) };

  if (options.form) {
    // form-encoded
    body = new URLSearchParams(options.form).toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
  } else if (options.data) {
    // JSON body
    body = JSON.stringify(options.data);
    headers["Content-Type"] = "application/json";
  }

  const fetchOptions = {
    method: options.method || (body ? "POST" : "GET"),
    headers,
  };
  if (body) {
    fetchOptions.data = body;
  }

  const response = await requestContext.fetch(endpoint, fetchOptions);

  if (!response.ok()) {
    const text = await response.text();
    await requestContext.dispose();
    throw new Error(
      `API request failed for ${role} and endpoint ${endpoint}: ${response.status()} ${response.statusText()}\n${text}`
    );
  }

  // Playwright's response.headers() returns a plain object
  const headersObj = response.headers();
  const contentType = headersObj["content-type"] || "";
  let responseData;

  if (contentType.includes("application/json")) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  await requestContext.dispose();
  return responseData;
};

/**
 * Filter the Results via Frappe reportview API
 */
export const filterApi = async (docType, filters, role = "manager") => {
  const endpoint = "/api/method/frappe.desk.reportview.get";

  // Frappe expects form-encoded doctype + JSON string filters
  const formPayload = {
    doctype: docType,
    filters: JSON.stringify(filters),
  };

  return apiRequest(
    endpoint,
    {
      method: "POST",
      form: formPayload,
    },
    role
  );
};

/**
 * Share a document with a user via form-encoded POST
 */
export const shareProjectWithUser = async ({
  doctype,
  name,
  user,
  readValue,
  writeValue,
  submitValue,
  shareValue,
  notifyValue,
  role = "manager",
}) => {
  const endpoint = "/api/method/frappe.share.add";

  const formPayload = {
    doctype,
    name,
    user,
    read: String(+readValue),
    write: String(+writeValue),
    submit: String(+submitValue),
    share: String(+shareValue),
    notify: String(+notifyValue),
  };

  return apiRequest(
    endpoint,
    {
      method: "POST",
      form: formPayload,
    },
    role
  );
};
