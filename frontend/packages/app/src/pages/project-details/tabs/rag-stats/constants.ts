import type { ColumnDef, HistoryRow, TriggerRow } from "./types";

export const TRIGGER_COLUMNS: ColumnDef<keyof TriggerRow>[] = [
  { key: "type", label: "Type", width: "200px" },
  { key: "alert", label: "Alert", width: "1fr" },
  { key: "triggerDate", label: "Trigger Date", width: "140px" },
];

export const HISTORY_COLUMNS: ColumnDef<keyof HistoryRow>[] = [
  { key: "type", label: "Type", width: "200px" },
  { key: "alert", label: "Alert", width: "1fr" },
  { key: "triggerDate", label: "Trigger Date", width: "140px" },
  { key: "clearDate", label: "Clear Date", width: "140px" },
];

export const STATUS_TRIGGERS: TriggerRow[] = [
  {
    id: "milestone",
    type: "Milestone",
    alert: "Milestone date passed without completion",
    triggerDate: "",
  },
  {
    id: "cost-burn",
    type: "Cost burn v Progress",
    alert: "50% of cost consumed, less than 50% of tickets completed",
    triggerDate: "",
  },
];

export const STATUS_HISTORY: HistoryRow[] = [
  {
    id: "milestone",
    type: "Milestone",
    alert: "Milestone date passed without completion",
    triggerDate: "",
    clearDate: "",
  },
  {
    id: "cost-burn",
    type: "Cost burn v Progress",
    alert: "50% of cost consumed, less than 50% of tickets completed",
    triggerDate: "",
    clearDate: "",
  },
];
