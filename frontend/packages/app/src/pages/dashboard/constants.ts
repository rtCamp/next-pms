/**
 * External dependencies.
 */
import type { ComboboxOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { DashboardView, DashboardViewMeta } from "./types";

// Per-view label + placeholder context line. The context copy is a placeholder
// until the leadership / manager widgets land in sibling issues.
export const DASHBOARD_VIEWS: Record<DashboardView, DashboardViewMeta> = {
  leadership: {
    label: "Leadership View",
    context: "Profits are looking up 2% from last month with revenues up 4%.",
  },
  manager: {
    label: "Manager View",
    context: "You have 12 empty allocations this week.",
  },
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
  { label: "Nimbus Analytics Enhancement", value: "nimbus-analytics-enhancement" },
  { label: "Atlas UI Stabilisation", value: "atlas-ui-stabilisation" },
  { label: "Headless CMS Migration", value: "headless-cms-migration" },
];
