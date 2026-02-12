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
  } else {
    await requestContext.dispose();
    throw new Error(
      `API request failed for ${role} with endpoint type ${
        options.method
      } and endpoint ${endpoint}: ${response.status()} ${response.statusText()}`,
    );
  }

  await requestContext.dispose();
  return responseData;
};
// ------------------------------------------------------------------------------------------

/**
 * Get Employee Details
 */
export const getEmployeeDetails = async (empId, role) => {
  const endpoint = `/api/resource/Employee/${empId}`;
  return await apiRequest(endpoint, { method: "GET" }, role);
};
// ------------------------------------------------------------------------------------------

/**
 * Create an Employee
 */
export const addEmployee = async (employeePayload, role) => {
  const endpoint = `/api/resource/Employee`;
  //const { first_name, last_name, status, gender, date_of_joining, date_of_birth } = employeePayload;

  //console.warn(`\n Data present in the ADD EMPLOYEE IS : \n
  //FIRST NAME : ${first_name} LAST NAME : ${last_name} \n STATUS : ${status} \n GENDER : ${gender} \n DATE OF JOINING : ${date_of_joining} \n DATE OF BIRTH : ${date_of_birth} \n ROLE : ${role} \n`);

  return await apiRequest(
    endpoint,
    {
      method: "POST",
      data: employeePayload,
    },
    role,
  );
};
// ------------------------------------------------------------------------------------------

/**
 * Delete an Employee
 */
export const deleteEmployee = async (empId, role) => {
  const endpoint = `/api/resource/Employee/${empId}`;
  return await apiRequest(endpoint, { method: "DELETE" }, role);
};
// ------------------------------------------------------------------------------------------

/**
 * Update an Employee Details
 */
export const updateEmployee = async (empId, employeePayload, role) => {
  const endpoint = `/api/resource/Employee/${empId}`;
  return await apiRequest(
    endpoint,
    {
      method: "PUT",
      data: employeePayload,
    },
    role,
  );
};
