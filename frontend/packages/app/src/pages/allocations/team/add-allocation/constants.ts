import { getTodayDate } from "@next-pms/design-system/date";

export const FALLBACK_DAILY_WORKING_HOURS = 8;

export const allocationRecurrenceLabels = {
  "one-time": "One Time",
  recurring: "Recurring",
} as const;

export const propagationModeLabels = {
  only_this: "This allocation",
  this_and_future: "This and future",
  whole_series: "All allocations",
} as const;

export const addAllocationDefaultValues = {
  employeeId: "",
  projectId: "",
  customer: "",
  recurrence: "one-time",
  includeWeekends: false,
  fromDate: getTodayDate(),
  toDate: getTodayDate(),
  hoursPerDay: 0,
  repeatFor: 1,
  isBillable: true,
  isTentative: false,
  note: "",
} as const;
