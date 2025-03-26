import { login } from "./authRequests";
//projectRequests.js
let context; // Global variable for request context
// ------------------------------------------------------------------------------------------
/**
 * Create a new Project entry.
 */
export const createProject = async ({ project_name, company, customer, billing_type, currency }) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }
  const response = await context.post(`/api/resource/Project`, {
    data: {
      project_name: project_name,
      company: company,
      customer: customer,
      billing_type: billing_type,
      currency: currency,
    },
  });
  return await response;
};
// ------------------------------------------------------------------------------------------
/**
 * Delete a Project entry.
 */
export const deleteProject = async (projectId) => {
  // Ensure the user is logged in before making API requests
  if (!context) {
    const loginResult = await login();
    context = loginResult.context;
  }
  const response = await context.delete(`/api/resource/Project/${projectId}`);
  return await response;
};
