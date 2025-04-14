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
export const createProject = async ({
  project_name,
  company,
  customer,
  billing_type,
  currency,
  custom_billing_type,
  estimated_costing,
  custom_project_billing_team,
  project_type,
  custom_default_hourly_billing_rate,
}) => {
  const ctx = await ensureAuth();
  const response = await ctx.post(`/api/resource/Project`, {
    data: {
      project_name: project_name,
      company: company,
      customer: customer,
      billing_type: billing_type,
      currency: currency,
      ...(project_type !== undefined && { project_type }),
      ...(custom_billing_type !== undefined && { custom_billing_type }),
      ...(estimated_costing !== undefined && { estimated_costing }),
      ...(custom_project_billing_team !== undefined && { custom_project_billing_team }),
      ...(custom_default_hourly_billing_rate !== undefined && { custom_default_hourly_billing_rate }),
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

/**
 * Get details of a project.
 */
export const getProjectDetails = async (projectId) => {
  const ctx = await ensureAuth();
  const response = await ctx.get(`/api/resource/Project/${projectId}`);
  return await response;
};
