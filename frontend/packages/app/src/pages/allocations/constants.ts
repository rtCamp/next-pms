/**
 * External dependencies.
 */
import { FilterField, SelectOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { AllocationsDuration } from "./types";

export const durationOptions: SelectOption[] = [
  { label: "This week", value: "this-week" },
  { label: "This month", value: "this-month" },
  { label: "This quarter", value: "this-quarter" },
];

export const allocationsTypeOptions: SelectOption[] = [
  { label: "All", value: "all" },
  { label: "Confirmed only", value: "confirmed" },
  { label: "Tentative only", value: "tentative" },
  { label: "Billable only", value: "billable" },
  { label: "Non-billable only", value: "non-billable" },
];

export const allocationsFilters: FilterField[] = [
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

export const navigationButtonAriaLabels: Record<
  "next" | "previous",
  Record<AllocationsDuration, string>
> = {
  next: {
    "this-week": "Next Week",
    "this-month": "Next Month",
    "this-quarter": "Next Quarter",
  },
  previous: {
    "this-week": "Previous Week",
    "this-month": "Previous Month",
    "this-quarter": "Previous Quarter",
  },
};
