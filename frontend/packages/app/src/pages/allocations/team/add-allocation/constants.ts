import { getTodayDate } from "@next-pms/design-system/date";

export const allocationRecurrenceLabels = {
  "one-time": "One Time",
  recurring: "Recurring",
} as const;

export const addAllocationDefaultValues = {
  employeeId: "",
  projectId: "",
  recurrence: "one-time",
  includeWeekends: true,
  fromDate: getTodayDate(),
  toDate: getTodayDate(),
  hoursPerDay: 0,
  repeatFor: 0,
  isBillable: true,
  isTentative: false,
  note: "",
} as const;
