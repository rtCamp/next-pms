/** The projects list showing open billable projects, in the React app's URL format. */
export const ACTIVE_PROJECTS_URL = `/projects?status=Open&advanced=${encodeURI(
  JSON.stringify([
    {
      id: "filter-billing-type",
      field: "custom_billing_type",
      operator: "!=",
      value: "Non-Billable",
    },
  ]),
)}`;

/** The projects list showing open projects with a red or amber RAG status. */
export const AT_RISK_PROJECTS_URL = `/projects?status=Open&rag=${encodeURI(
  JSON.stringify(["red", "amber"]),
)}`;
