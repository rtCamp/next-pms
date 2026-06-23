/**
 * External dependencies.
 */
import type { SelectOption } from "@rtcamp/frappe-ui-react";

export const LAST_WEEK_VALUE = "last-week";
export const THIS_WEEK_VALUE = "this-week";
export const THIS_MONTH_VALUE = "this-month";

export const PERIOD_OPTIONS: SelectOption[] = [
  { value: LAST_WEEK_VALUE, label: "Last week" },
  { value: THIS_WEEK_VALUE, label: "This week" },
];

export const TIMESHEET_COLUMNS = [
  { key: "name", label: "Members", width: 3, align: "left" },
  { key: "billable", label: "Billable h", width: "96px", align: "right" },
  {
    key: "nonBillable",
    label: "Non-billable h",
    width: "112px",
    align: "right",
  },
  { key: "expected", label: "Expected h", width: "96px", align: "right" },
  { key: "delta", label: "Delta", width: "72px", align: "right" },
  { key: "status", label: "", width: "48px", align: "right" },
];
