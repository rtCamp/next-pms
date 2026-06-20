/**
 * External dependencies.
 */
import type { ComboboxOption, SelectOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { ForecastData } from "./widget/forecastBreakdownCard";
import type { NotificationItem } from "./widget/notificationsCard";
import type { StatCardData } from "./widget/statCard";

export const MANAGER_STATS: StatCardData[] = [
  { label: "At risk projects", value: "4" },
  { label: "Members without allocation", value: "12", subLabel: "this week" },
  { label: "Timesheets to review", value: "24", subLabel: "this week" },
  { label: "Outstanding timesheets", value: "4" },
];

export const ALL_ROLES_VALUE = "all";

// Mock role filter from the design until real data is wired in a later issue.
export const ROLE_OPTIONS: SelectOption[] = [
  { value: ALL_ROLES_VALUE, label: "All roles" },
  { value: "delivery-manager", label: "Delivery Manager" },
  { value: "project-manager", label: "Project Manager" },
  { value: "developer", label: "Developer" },
  { value: "designer", label: "Designer" },
];

// Hard-coded forecast splits from the design until real data is wired in a later issue.
export const FORECAST_BY_ROLE: Record<string, ForecastData> = {
  [ALL_ROLES_VALUE]: { allocated: 42, tentative: 18, unallocated: 40 },
  "delivery-manager": { allocated: 55, tentative: 20, unallocated: 25 },
  "project-manager": { allocated: 48, tentative: 22, unallocated: 30 },
  developer: { allocated: 65, tentative: 15, unallocated: 20 },
  designer: { allocated: 38, tentative: 12, unallocated: 50 },
};

// Hard-coded notifications from the design until real data is wired in a later issue.
export const LEADERSHIP_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    icon: "folder",
    title: "Project health update",
    body: "Orion Marketing Automation Revamp is now on track.",
    timeLabel: "32m",
  },
  {
    id: "2",
    icon: "fire",
    title: "Risk update",
    body: "Gowtham updated the risk status to Mitigated in Atlas UI Stabilisation.",
    timeLabel: "18h",
  },
  {
    id: "3",
    icon: "file",
    title: "Client feedback available",
    body: "Nov 2025 client feedback received for Nimbus Analytics Enhancement",
    timeLabel: "2d",
  },
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
