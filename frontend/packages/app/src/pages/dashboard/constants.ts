/**
 * External dependencies.
 */
import type { ComboboxOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { NotificationItem } from "./widget/notificationsCard";

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
