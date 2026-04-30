import { FilterField } from "@rtcamp/frappe-ui-react";

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

export const sampleFields: FilterField[] = [
  {
    name: "project",
    label: "Project",
    type: "select",
    options: projectOptions,
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: statusOptions,
  },
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
    name: "title",
    label: "Title",
    type: "string",
  },
  {
    name: "due_date",
    label: "Due Date",
    type: "date",
  },
  {
    name: "estimate",
    label: "Estimate (hours)",
    type: "number",
  },
];

export const personalTimesheetFilters: FilterField[] = [
  {
    fieldCategory: "Timesheet Detail",
    name: "project_name",
    label: "Project",
    type: "string",
  },
  {
    fieldCategory: "Task",
    name: "subject",
    label: "Task",
    type: "string",
  },
  {
    name: "date",
    label: "Date",
    type: "daterange",
  },
];

export const teamTimesheetFilters: FilterField[] = [
  {
    fieldCategory: "Timesheet Detail",
    name: "project_name",
    label: "Project",
    type: "string",
  },
  {
    fieldCategory: "Task",
    name: "subject",
    label: "Task",
    type: "string",
  },
  {
    name: "date",
    label: "Date",
    type: "daterange",
  },
  {
    fieldCategory: "Timesheet",
    name: "employee_name",
    label: "Member",
    type: "string",
  },
  {
    fieldCategory: "Employee",
    name: "status",
    label: "Member Status",
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
      { label: "Suspended", value: "Suspended" },
      { label: "Left", value: "Left" },
    ],
    type: "select",
  },
  {
    fieldCategory: "Employee",
    name: "custom_business_unit",
    label: "Business Unit",
    type: "string",
  },
];
