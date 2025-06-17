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

  // Define requestData at the top so it's accessible in the whole function
  const requestData = {
    project_name,
    company,
    customer,
    billing_type,
    currency,
    ...(project_type !== undefined && { project_type }),
    ...(custom_billing_type !== undefined && { custom_billing_type }),
    ...(estimated_costing !== undefined && { estimated_costing }),
    ...(custom_project_billing_team !== undefined && { custom_project_billing_team }),
    ...(custom_default_hourly_billing_rate !== undefined && { custom_default_hourly_billing_rate }),
  };

  const response = await ctx.post(`/api/resource/Project`, {
    data: requestData,
  });

  if (!response.ok()) {
    let errorMessage = `Failed to create project '${project_name}'. Status: ${response.status()}`;

    try {
      const errorData = await response.json();
      errorMessage += `\nError Response: ${JSON.stringify(errorData, null, 2)}`;
    } catch {
      const rawBody = await response.text();
      errorMessage += `\nFailed to parse error response as JSON. Raw body: ${rawBody}`;
    }

    errorMessage += `\nRequest Payload: ${JSON.stringify(requestData, null, 2)}`;

    throw new Error(errorMessage);
  }

  return response;
};

/**
 * Delete a Project entry.
 */
export const deleteProject = async (projectId) => {
  const ctx = await ensureAuth();
  const response = await ctx.delete(`/api/resource/Project/${projectId}`);

  if (!response.ok()) {
    throw new Error(
      `Failed to get response for Delete project for projectId: ${projectId} . Status: ${response.status()}`
    );
  }
  return response;
};

/**
 * Get details of a project.
 */
export const getProjectDetails = async (projectId) => {
  const ctx = await ensureAuth();
  const response = await ctx.get(`/api/resource/Project/${projectId}`);
  if (!response.ok()) {
    throw new Error(
      `Failed to get response for get project Detials for projectId: ${projectId} . Status: ${response.status()}`
    );
  }
  return response;
};
