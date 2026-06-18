/**
 * External dependencies.
 */
import type { ComboboxOption, SelectOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { ForecastData } from "./forecastBreakdownCard";
import type { HeatmapRow } from "./heatmapCard";
import type { KpiCardData } from "./kpiCard";
import type { NotificationItem } from "./notificationsCard";
import type { StatCardData } from "./statCard";
import type { UtilisationData } from "./utilisedTimeCard";

// Hard-coded financial KPIs from the design until real data is wired in a later issue.
export const LEADERSHIP_KPIS: KpiCardData[] = [
  {
    label: "Last month's revenue",
    value: "$300,000",
    trend: { value: "+15%", direction: "up", tone: "positive" },
    comparison: "vs Dec 2025",
  },
  {
    label: "Last month's cost",
    value: "$120,000",
    trend: { value: "-2%", direction: "down", tone: "positive" },
    comparison: "vs Dec 2025",
  },
  {
    label: "Last month's profit margin",
    value: "42%",
    trend: { value: "11%", direction: "down", tone: "negative" },
    comparison: "vs Dec 2025",
  },
];

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

export const ALL_MEMBERS_VALUE = "all-members";

export const MEMBER_OPTIONS: SelectOption[] = [
  { value: ALL_MEMBERS_VALUE, label: "All members" },
  { value: "active-members", label: "Active members" },
  { value: "on-leave", label: "On leave" },
];

export const HEATMAP_MONTHS = ["Jan", "Feb", "Mar"] as const;

// 7 rows x 12 cells transcribed from the Figma heatmap frame (node 3543:327932).
export const HEATMAP_ROWS: HeatmapRow[] = [
  {
    role: "Project Manager",
    cells: [
      "full",
      "full",
      "full",
      "partial",
      "full",
      "partial",
      "partial",
      "full",
      "full",
      "full",
      "full",
      "none",
    ],
  },
  {
    role: "Senior Project Manager",
    cells: [
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "none",
      "full",
      "none",
      "none",
      "none",
    ],
  },
  {
    role: "Frontend Engineer",
    cells: [
      "full",
      "full",
      "partial",
      "none",
      "partial",
      "partial",
      "partial",
      "full",
      "none",
      "none",
      "none",
      "none",
    ],
  },
  {
    role: "Senior Frontend Engineer",
    cells: [
      "full",
      "full",
      "partial",
      "full",
      "full",
      "none",
      "full",
      "full",
      "full",
      "full",
      "partial",
      "none",
    ],
  },
  {
    role: "Associate Frontend Engineer",
    cells: [
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "none",
      "none",
      "none",
      "none",
    ],
  },
  {
    role: "QA Engineer",
    cells: [
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "none",
    ],
  },
  {
    role: "Lead QA Engineer",
    cells: [
      "full",
      "full",
      "partial",
      "full",
      "full",
      "full",
      "full",
      "full",
      "full",
      "none",
      "none",
      "none",
    ],
  },
];
