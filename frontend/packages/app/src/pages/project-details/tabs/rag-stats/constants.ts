import type { ColumnDef } from "./types";

export const TRIGGER_COLUMNS: ColumnDef[] = [
  { key: "type", label: "Type", width: "70px" },
  { key: "alert", label: "Alert", width: "1fr" },
  { key: "trigger_date", label: "Trigger Date", width: "160px" },
];

export const HISTORY_COLUMNS: ColumnDef[] = [
  { key: "type", label: "Type", width: "70px" },
  { key: "alert", label: "Alert", width: "1fr" },
  { key: "trigger_date", label: "Trigger Date", width: "160px" },
  { key: "clear_date", label: "Clear Date", width: "160px" },
];
