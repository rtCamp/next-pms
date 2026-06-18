/**
 * External dependencies.
 */
import type { ComboboxOption, SelectOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import type { StatCardData } from "./statCard";
import type { TimesheetMember } from "./timesheetsCard";

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

export const LAST_WEEK_VALUE = "last-week";

// Mock period filter + timesheet rows from the design until real data is wired in a later issue.
export const PERIOD_OPTIONS: SelectOption[] = [
  { value: LAST_WEEK_VALUE, label: "Last week" },
  { value: "this-week", label: "This week" },
  { value: "this-month", label: "This month" },
];

export const TIMESHEET_COLUMNS = [
  { key: "name", label: "Members", width: 3, align: "left" },
  { key: "billable", label: "Billable h", width: "96px", align: "right" },
  {
    key: "nonBillable",
    label: "Non-billable h",
    width: "112px",
    align: "right",
  },
  { key: "expected", label: "Expected h", width: "96px", align: "right" },
  { key: "delta", label: "Delta", width: "72px", align: "right" },
  { key: "status", label: "", width: "48px", align: "right" },
];

export const TIMESHEET_MEMBERS: TimesheetMember[] = [
  {
    name: "Julian Andrews",
    billable: 28,
    nonBillable: 8,
    expected: 40,
    delta: 4,
    status: "pending",
  },
  {
    name: "Kathy Philips",
    billable: 40,
    nonBillable: 0,
    expected: 40,
    delta: 0,
    status: "pending",
  },
  {
    name: "Susanna Martin",
    billable: 8,
    nonBillable: 0,
    expected: 10,
    delta: 2,
    status: "on-track",
  },
  {
    name: "Dev Patel",
    billable: 28,
    nonBillable: 8,
    expected: 40,
    delta: 4,
    status: "on-track",
  },
  {
    name: "Divya Kumar",
    billable: 18,
    nonBillable: 2,
    expected: 20,
    delta: 0,
    status: "off-track",
  },
  {
    name: "Anusha Patel",
    billable: 18,
    nonBillable: 2,
    expected: 20,
    delta: 0,
    status: "on-track",
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
