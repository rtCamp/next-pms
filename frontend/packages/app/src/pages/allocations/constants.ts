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
export const SEARCH_PARAM_KEY = "search";
export const DATE_PARAM_KEY = "date";
export const DURATION_PARAM_KEY = "duration";
export const ALLOCATION_TYPE_PARAM_KEY = "allocationType";
export const COMPOSITE_FILTERS_PARAM_KEY = "compositeFilters";
export const DEFAULT_DURATION = "this-quarter";
export const DURATION_PARAM_VALUES = [
  "this-week",
  "this-month",
  "this-quarter",
] as const satisfies readonly AllocationsDuration[];

export const propagationModeLabels = {
  only_this: "This allocation",
  this_and_future: "This and future",
  whole_series: "All allocations",
} as const;

export const EDIT_SCHEDULE_APPLY_MODES = new Set([
  "only_this",
  "this_and_future",
  "whole_series",
] as const);

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
