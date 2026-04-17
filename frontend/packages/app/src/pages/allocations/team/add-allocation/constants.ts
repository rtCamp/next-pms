import type {
  AllocationEmployeeOption,
  AllocationProjectOption,
} from "./types";

export const ALLOCATION_RECURRENCE_LABELS = {
  "one-time": "One Time",
  recurring: "Recurring",
} as const;

export const EMPLOYEE_OPTIONS: AllocationEmployeeOption[] = [
  { value: "emp-david", label: "David Liu" },
  { value: "emp-grace", label: "Grace Park" },
  { value: "emp-noah", label: "Noah Adeyemi" },
];

export const PROJECT_OPTIONS: AllocationProjectOption[] = [
  { value: "proj-atlas", label: "Atlas UI Stabilisation" },
  { value: "proj-portal", label: "Client Portal" },
  { value: "proj-api", label: "API Gateway" },
];
