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
 * Create a new Project entry.
 */
export const createProject = async ({ project_name, company, customer, billing_type, currency }) => {
  const ctx = await ensureAuth();
  const response = await ctx.post(`/api/resource/Project`, {
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

/**
 * Delete a Project entry.
 */
export const deleteProject = async (projectId) => {
  const ctx = await ensureAuth();
  const response = await ctx.delete(`/api/resource/Project/${projectId}`);
  return await response;
};
