import { login } from "./authRequests";
let context; // Global variable for request context
// ------------------------------------------------------------------------------------------
/**
 * Create a new task entry.
 */
export const createTask = async ({ subject, project, description }) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }

  const response = await context.post(`/api/resource/Task`, {
    data: {
      subject: subject,
      project: project,
      description: description,
    },
  });
  return await response;
};
// ------------------------------------------------------------------------------------------
/**
 * Delete a Task entry.
 */
export const deleteTask = async (taskID) => {
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
 * Delete a Task entry.
 */
export const likeTask = async (taskID) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }
  const response = await context.post(`/api/method/frappe.desk.like.toggle_like`, {
    data: {
      doctype: "Task",
      name: `${taskID}`,
      add: "Yes",
    },
  });
  return await response;
};
// ------------------------------------------------------------------------------------------
/**
 * Delete a Task entry.
 */
export const unlikeTask = async (taskID) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }
  const response = await context.post(`/api/resource/Task/${taskID}`);
  return await response;
};
