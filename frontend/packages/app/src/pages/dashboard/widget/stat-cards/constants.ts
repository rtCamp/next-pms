/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";

export const ACTIVE_PROJECTS_URL = `${ROUTES.project}?status=Open&advanced=${encodeURI(
  JSON.stringify([
    {
      id: "filter-billing-type",
      field: "custom_billing_type",
      operator: "!=",
      value: "Non-Billable",
    },
  ]),
)}`;

export const AT_RISK_PROJECTS_URL = `${ROUTES.project}?status=Open&rag=${encodeURI(
  JSON.stringify(["red", "amber"]),
)}`;
