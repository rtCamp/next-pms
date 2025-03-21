import { login } from "./authRequests";

let context; // Global variable for request context
// ------------------------------------------------------------------------------------------

/**
 * Delete a timesheet entry.
 */
export const deleteTaskEndPoint = async (taskID) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  const response = await context.delete(`/api/resource/Task/${taskID}`);
  return await response;
};

// ------------------------------------------------------------------------------------------

/**
 * Get task details for the specified employee by searching with the task name.

 */
export const getTaskDetails = async (taskName) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  // Build query string dynamically based on provided parameters
  const queryParams = new URLSearchParams({});
  
  if (taskName) queryParams.append("search", taskName);

  // Fetch Task detail by searching using task name
  const response = await context.get(`/api/method/next_pms.timesheet.api.task.get_task_list?${queryParams.toString()}`);
  return await response;
};
