import { login } from "./authRequests";
let context; // Global variable for request context

// Helper function to ensure authentication
const ensureAuth = async () => {
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }
  return context;
};

/**
 * Create a new task entry.
 */
export const createTask = async ({ subject, project, description }) => {
  const ctx = await ensureAuth();
  const response = await ctx.post(`/api/resource/Task`, {
    data: {
      subject: subject,
      project: project,
      description: description,
    },
  });
  return await response;
};

/**
 * Delete a Task entry.
 */
export const deleteTask = async (taskID) => {
  const ctx = await ensureAuth();
  const response = await ctx.delete(`/api/resource/Task/${taskID}`);
  return await response;
};

/**
 * Like a Task entry.
 */
export const likeTask = async (taskID) => {
  const ctx = await ensureAuth();
  const response = await ctx.post(`/api/method/frappe.desk.like.toggle_like`, {
    data: {
      doctype: "Task",
      name: `${taskID}`,
      add: "Yes",
    },
  });
  return await response;
};

/**
 * Unlike a Task entry.
 */
export const unlikeTask = async (taskID) => {
  const ctx = await ensureAuth();
  const response = await ctx.post(`/api/resource/Task/${taskID}`);
  return await response;
};
