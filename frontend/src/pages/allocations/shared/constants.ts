import type { AllocationsDuration } from "./types";

/** Rows per request. */
export const ALLOCATIONS_PAGE_SIZE = 10;

export const SEARCH_PARAM = "search";
export const DATE_PARAM = "date";
export const DURATION_PARAM = "duration";
export const ALLOCATION_TYPE_PARAM = "allocationType";
export const COMPOSITE_FILTERS_PARAM = "compositeFilters";

export const DEFAULT_DURATION: AllocationsDuration = "this-quarter";

/** Weeks each duration shows; Previous and Next move the date by as many weeks. */
export const DURATION_WEEKS: Record<AllocationsDuration, number> = {
  "this-week": 1,
  "this-month": 4,
  "this-quarter": 13,
};

export const DURATION_OPTIONS: { label: string; value: AllocationsDuration }[] =
  [
    { label: "This week", value: "this-week" },
    { label: "This month", value: "this-month" },
    { label: "This quarter", value: "this-quarter" },
  ];

export const NAVIGATION_LABELS: Record<
  "previous" | "next",
  Record<AllocationsDuration, string>
> = {
  previous: {
    "this-week": "Previous Week",
    "this-month": "Previous Month",
    "this-quarter": "Previous Quarter",
  },
  next: {
    "this-week": "Next Week",
    "this-month": "Next Month",
    "this-quarter": "Next Quarter",
  },
};

/** `source` of an override row the leave sync wrote. */
export const LEAVE_OVERRIDE_SOURCE = "Leave";

/** Hours a week assumed when an employee has none set, for the hourly rate. */
export const DEFAULT_HOURS_PER_WEEK = 40;
export const WEEKS_PER_MONTH = 4;

/** Debounce for the designation and department filters, in ms. */
export const FILTER_DEBOUNCE_MS = 400;
/** Debounce for the over-allocation check, in ms. */
export const OVER_ALLOCATION_DEBOUNCE_MS = 500;
/** Realtime updates arriving within this window load the rows once, in ms. */
export const REALTIME_DEBOUNCE_MS = 500;

export const RESOURCE_ALLOCATION_DOCTYPE = "Resource Allocation";

/** The operators of the Filter panel's link and select fields. */
export const EQUALITY_OPERATORS = [
  { label: "Equals", value: "=" },
  { label: "Not Equals", value: "!=" },
];

export type AllocationsView = "team" | "project";

/** The two allocation views in the breadcrumb's view menu. */
export const ALLOCATIONS_VIEWS: {
  key: AllocationsView;
  label: string;
  routeName: string;
  icon: string;
}[] = [
  {
    key: "team",
    label: "Team",
    routeName: "allocations-team",
    icon: "lucide-users",
  },
  {
    key: "project",
    label: "Project",
    routeName: "allocations-project",
    icon: "lucide-folder",
  },
];
