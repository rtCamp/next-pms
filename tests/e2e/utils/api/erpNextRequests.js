import { request } from "@playwright/test";
import { baseURL, loadAuthState, fetchWithRetry } from "./apiClient";

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
      `API request failed for ${role} and endpoint ${endpoint}: ${response.status()} ${response.statusText()}`,
    );
  }

  await requestContext.dispose();
  return responseData;
};
// ------------------------------------------------------------------------------------------

/**
 * Get Exchange Rate
 */
export const getExchangeRate = async (from_currency, to_currency) => {
  const endpoint = `/api/method/erpnext.setup.utils.get_exchange_rate?from_currency=${from_currency}&to_currency=${to_currency}`;
  return await apiRequest(endpoint, { method: "GET" });
};
