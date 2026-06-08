/**
 * Internal dependencies.
 */
import type { ContractRow, RateRow } from "./types";

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
  { key: "hoursBought", label: "Hours bought", width: "88px" },
  { key: "hoursUsed", label: "Hours used", width: "88px" },
  { key: "hoursLeft", label: "Hours left", width: "88px" },
  { key: "salesOrder", label: "Sales order", width: "88px" },
  { key: "salesInvoice", label: "Sales invoice", width: "88px" },
  { key: "actions", label: "", width: "28px", align: "right" },
];

export const RATE_COLUMNS: ColumnDef<RateColumnKey>[] = [
  { key: "name", label: "Members", width: "1fr" },
  { key: "amount", label: "Hourly rates", width: "104px", align: "right" },
  { key: "date", label: "Valid from", width: "120px" },
  { key: "actions", label: "", width: "28px", align: "right" },
];
