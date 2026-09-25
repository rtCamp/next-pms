import { request } from "@playwright/test";
import {
  baseURL,
  loadAuthState,
  fetchWithRetry,
  deleteDocument,
} from "./apiClient";

/**
 * Helper function to load build the API request
 */
export const apiRequest = async (endpoint, options = {}, role = "manager") => {
  const authFilePath = loadAuthState(role);
  const requestContext = await request.newContext({
    baseURL,
    storageState: authFilePath,
  });
  const response = await fetchWithRetry(requestContext, endpoint, {
    timeout: 120000,
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
export const deleteEmployee = async (empId, role = "admin") => {
  return await deleteDocument("Employee", empId, role);
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
