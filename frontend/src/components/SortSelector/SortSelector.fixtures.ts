import type { SortField } from "./types";

export const CURRENCY_TOOLTIP = "Select a currency to enable this sort";

export const FIELDS: SortField[] = [
  { field: "project_name", label: "Project name" },
  { field: "custom_project_phase", label: "Phase" },
  {
    field: "burn_rate_per_week",
    label: "Burn rate/week",
    disabled: true,
    tooltipText: CURRENCY_TOOLTIP,
  },
  { field: "cost_burn_percent", label: "Cost burn" },
  { field: "expected_start_date", label: "Start date" },
  { field: "expected_end_date", label: "End date" },
];
