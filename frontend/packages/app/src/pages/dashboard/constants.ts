/**
 * External dependencies.
 */
import type { ComboboxOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { StatCardData } from "./statCard";

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
