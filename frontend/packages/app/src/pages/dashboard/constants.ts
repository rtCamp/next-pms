/**
 * External dependencies.
 */
import type { ComboboxOption, SelectOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { StatCardData } from "./statCard";
import type { UtilisationData } from "./utilisedTimeCard";

// Hard-coded summary stats from the design until real data is wired in a later issue.
export const LEADERSHIP_STATS: StatCardData[] = [
  { label: "Active Projects", value: "15" },
  { label: "At risk projects", value: "4" },
  { label: "Members without allocation", value: "12", subLabel: "this month" },
  { label: "Non-billable hours logged", value: "16h", subLabel: "this month" },
];

export const MANAGER_STATS: StatCardData[] = [
  { label: "At risk projects", value: "4" },
  { label: "Members without allocation", value: "12", subLabel: "this week" },
  { label: "Timesheets to review", value: "24", subLabel: "this week" },
  { label: "Outstanding timesheets", value: "4" },
];

export const ALL_ROLES_VALUE = "all";

// Mock role filter + utilisation splits from the design until real data is wired in a later issue.
export const ROLE_OPTIONS: SelectOption[] = [
  { value: ALL_ROLES_VALUE, label: "All roles" },
  { value: "delivery-manager", label: "Delivery Manager" },
  { value: "project-manager", label: "Project Manager" },
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
];

export const UTILISATION_BY_ROLE: Record<string, UtilisationData> = {
  [ALL_ROLES_VALUE]: { billable: 65, nonBillable: 35 },
  "delivery-manager": { billable: 72, nonBillable: 28 },
  "project-manager": { billable: 60, nonBillable: 40 },
  developer: { billable: 80, nonBillable: 20 },
  designer: { billable: 55, nonBillable: 45 },
};

export const ALL_CLIENTS_VALUE = "all-clients";
export const ALL_PROJECTS_VALUE = "all-projects";

// Mock options until real client / project scoping is wired in a later issue.
export const MOCK_CLIENT_OPTIONS: ComboboxOption[] = [
  { label: "All Clients", value: ALL_CLIENTS_VALUE },
  { label: "Nimbus Analytics", value: "nimbus-analytics" },
  { label: "Atlas Systems", value: "atlas-systems" },
  { label: "Venus E-commerce", value: "venus-ecommerce" },
];

export const MOCK_PROJECT_OPTIONS: ComboboxOption[] = [
  { label: "All Projects", value: ALL_PROJECTS_VALUE },
  {
    label: "Nimbus Analytics Enhancement",
    value: "nimbus-analytics-enhancement",
  },
  { label: "Atlas UI Stabilisation", value: "atlas-ui-stabilisation" },
  { label: "Headless CMS Migration", value: "headless-cms-migration" },
];
