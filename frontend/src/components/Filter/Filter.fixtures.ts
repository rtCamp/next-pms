import type { FilterCondition, FilterField } from "./types";

const projectOptions = [
  { label: "Atlas UI Stabilization", value: "atlas-ui" },
  { label: "Backend Refactor", value: "backend" },
  { label: "Mobile App v2", value: "mobile-v2" },
  { label: "Dashboard Redesign", value: "dashboard" },
  { label: "API Documentation", value: "api-docs" },
];

const statusOptions = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in-progress" },
  { label: "Review", value: "review" },
  { label: "Done", value: "done" },
  { label: "Cancelled", value: "cancelled" },
];

const priorityOptions = [
  { label: "Urgent", value: "urgent" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const assigneeOptions = [
  { label: "John Doe", value: "john" },
  { label: "Jane Smith", value: "jane" },
  { label: "Bob Wilson", value: "bob" },
  { label: "Alice Johnson", value: "alice" },
];

export const FIELDS: FilterField[] = [
  {
    name: "project",
    label: "Project",
    type: "select",
    options: projectOptions,
  },
  { name: "status", label: "Status", type: "select", options: statusOptions },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    options: priorityOptions,
  },
  {
    name: "assignee",
    label: "Assignee",
    type: "select",
    options: assigneeOptions,
  },
  {
    name: "customer_link",
    label: "Customer (Link)",
    type: "link",
    link: { doctype: "User", labelField: "full_name" },
  },
  { name: "title", label: "Title", type: "string" },
  { name: "due_date", label: "Due Date", type: "date" },
  { name: "estimate", label: "Estimate (hours)", type: "number" },
  { name: "date_range", label: "Date Range", type: "daterange" },
];

export const LINK_RECORDS: Record<string, Record<string, string>[]> = {
  User: [
    { name: "john", full_name: "John Doe" },
    { name: "jane", full_name: "Jane Smith" },
    { name: "bob", full_name: "Bob Wilson" },
    { name: "alice", full_name: "Alice Johnson" },
  ],
};

export const PROJECT_CONDITION: FilterCondition = {
  id: "1",
  field: "project",
  operator: "is",
  value: "atlas-ui",
};

export const MULTIPLE_CONDITIONS: FilterCondition[] = [
  PROJECT_CONDITION,
  { id: "2", field: "status", operator: "is", value: "in-progress" },
  { id: "3", field: "assignee", operator: "is", value: "john" },
];
