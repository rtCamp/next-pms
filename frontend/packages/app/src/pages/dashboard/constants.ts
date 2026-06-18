/**
 * External dependencies.
 */
import type { ComboboxOption, SelectOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { AssignedProject } from "./assignedProjectsCard";
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

export const ALL_CUSTOMERS_VALUE = "all";

// Mock customer filter + assigned-project rows from the design until real data is wired in a later issue.
export const CUSTOMER_OPTIONS: SelectOption[] = [
  { value: ALL_CUSTOMERS_VALUE, label: "All customers" },
  { value: "nimbus-analytics", label: "Nimbus Analytics" },
  { value: "atlas-systems", label: "Atlas Systems" },
  { value: "venus-ecommerce", label: "Venus E-commerce" },
  { value: "helios-media", label: "Helios Media" },
];

export const ASSIGNED_PROJECTS_COLUMNS = [
  { key: "name", label: "Projects", width: 3, align: "left" },
  { key: "remaining", label: "Remaining", width: "96px", align: "right" },
  { key: "hoursBurn", label: "Hours Burn", width: "140px", align: "center" },
  {
    key: "billableLastWeek",
    label: "Billable (last week)",
    width: "160px",
    align: "right",
  },
  {
    key: "nonBillableLastWeek",
    label: "Non-billable (last week)",
    width: "176px",
    align: "right",
  },
];

export const ASSIGNED_PROJECTS: AssignedProject[] = [
  {
    name: "Nimbus Analytics Enhancement",
    customer: "nimbus-analytics",
    remaining: 110,
    used: 210,
    total: 320,
    billableLastWeek: 34,
    nonBillableLastWeek: 6,
  },
  {
    name: "Atlas UI Stabilisation",
    customer: "atlas-systems",
    remaining: 88,
    used: 112,
    total: 200,
    billableLastWeek: 18,
    nonBillableLastWeek: 5,
  },
  {
    name: "Atlas Mobile App Checkout Flow Stabilisation",
    customer: "atlas-systems",
    remaining: 110,
    used: 190,
    total: 300,
    billableLastWeek: 42,
    nonBillableLastWeek: 8,
  },
  {
    name: "Venus E-commerce Platform Upgrade",
    customer: "venus-ecommerce",
    remaining: 64,
    used: 96,
    total: 160,
    billableLastWeek: 16,
    nonBillableLastWeek: 3,
  },
  {
    name: "Headless CMS Migration",
    customer: "helios-media",
    remaining: 82,
    used: 138,
    total: 220,
    billableLastWeek: 26,
    nonBillableLastWeek: 9,
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
