import { request } from "@playwright/test";
import { baseURL, loadAuthState, fetchWithRetry, deleteDocument } from "./apiClient";

/**
 * Helper function to load build the API request
 */
export const apiRequest = async (endpoint, options = {}, role = "admin") => {
  const authFilePath = loadAuthState(role);
  const requestContext = await request.newContext({ baseURL, storageState: authFilePath });
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
      `API request failed for ${role} and endpoint ${endpoint}: ${response.status()} ${response.statusText()}`
    );
  }

  await requestContext.dispose();
  return responseData;
};
// ------------------------------------------------------------------------------------------

/**
 * Get User Group Details Details.
 */
export const getUserGroupDetails = async () => {
  return await apiRequest(`/api/resource/User Group`, {
    method: "GET",
  });
};
// ------------------------------------------------------------------------------------------

/**
 * Create User Group
 */
export const createUserGroup = async ({ user, name }) => {
  const payload = {
    user_group_members: [
      {
        user,
      },
    ],
    __newname: name,
  };

  return await apiRequest("/api/resource/User Group", {
    method: "POST",
    data: payload,
  });
};
// ------------------------------------------------------------------------------------------

/**
 * Delete a User Group
 */
export const deleteUserGroup = async (userGroupName) => {
  return await deleteDocument("User Group", userGroupName, "admin");
};
