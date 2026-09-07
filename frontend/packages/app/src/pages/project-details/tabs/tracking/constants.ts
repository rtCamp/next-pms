/**
 * Internal dependencies.
 */
import type { Role } from "@/types";
import type { ContractRow, RateRow, TrackingLayout, WidgetKey } from "./types";

export const CUSTOMIZATION_ROLES: Role[] = ["Projects Manager"];

export const CUSTOMIZABLE_WIDGETS: { key: WidgetKey; label: string }[] = [
  { key: "task_completion", label: "Task completion" },
  { key: "budget_burn", label: "Budget burn" },
  { key: "cost_burn", label: "Cost burn" },
];

export const CUSTOMIZABLE_WIDGET_KEYS: WidgetKey[] = CUSTOMIZABLE_WIDGETS.map(
  ({ key }) => key,
);

export const ROW_COLUMNS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
};

/**
 * Returns the default layout for the tracking tab based on the billing type.
 */
export function getDefaultLayout(billingType: string): TrackingLayout {
  const isBillable = billingType !== "Non-Billable";

  return [
    isBillable ? ["financials", "task_completion"] : ["task_completion"],
    ["hours_usage", "invoice_burn"],
    ["budget_burn", "cost_burn"],
    ["lifetime_to_date", "lifetime_expected", "lifetime_vs_billed"],
    ["contracts"],
    ["rates"],
  ];
}

export type ColumnDef<K extends string = string> = {
  key: K;
  label: string;
  width: string;
  align?: "left" | "right";
};

export type ContractColumnKey = keyof ContractRow | "actions";
export type RateColumnKey = keyof RateRow | "actions";

export const CONTRACT_COLUMNS: ColumnDef<ContractColumnKey>[] = [
  { key: "startDate", label: "Start date", width: "88px" },
  { key: "endDate", label: "End date", width: "88px" },
  { key: "hoursBought", label: "Hours bought", width: "88px", align: "right" },
  { key: "hoursUsed", label: "Hours used", width: "88px", align: "right" },
  { key: "hoursLeft", label: "Hours left", width: "88px", align: "right" },
  { key: "salesOrder", label: "Sales order", width: "1fr" },
  { key: "salesInvoice", label: "Sales invoice", width: "1fr" },
  { key: "actions", label: "", width: "28px", align: "right" },
];

export const RATE_COLUMNS: ColumnDef<RateColumnKey>[] = [
  { key: "name", label: "Members", width: "1fr" },
  { key: "amount", label: "Hourly rates", width: "104px", align: "right" },
  { key: "date", label: "Valid from", width: "120px" },
  { key: "actions", label: "", width: "28px", align: "right" },
];
