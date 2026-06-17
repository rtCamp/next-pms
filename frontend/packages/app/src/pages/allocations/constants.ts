/**
 * External dependencies.
 */
import { SelectOption } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { AllocationsDuration } from "./types";

export const ALLOCATIONS_PAGE_SIZE = 10;
export const DEFAULT_HOURS_PER_WEEK = 40;
export const WEEKS_PER_MONTH = 4;
export const DEFAULT_CURRENCY = "INR";
export const ALLOCATION_WORKING_FREQUENCIES = ["Per Day", "Per Week"] as const;

export const durationOptions: SelectOption[] = [
  { label: "This week", value: "this-week" },
  { label: "This month", value: "this-month" },
  { label: "This quarter", value: "this-quarter" },
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
