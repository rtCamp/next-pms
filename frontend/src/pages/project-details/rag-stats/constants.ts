import type { RagColour, RagColumn } from "./types";

export const RAG_API = "/api/v2/method/rtcamp.api.project_rag";

export const TRIGGER_COLUMNS: RagColumn[] = [
  { key: "type", label: "Type", width: "180px" },
  { key: "alert", label: "Alert", width: "minmax(200px,1fr)" },
  { key: "trigger_date", label: "Trigger Date", width: "160px" },
];

export const HISTORY_COLUMNS: RagColumn[] = [
  ...TRIGGER_COLUMNS,
  { key: "clear_date", label: "Clear Date", width: "160px" },
];

export const RAG_COLOUR_CLASS: Record<RagColour, string> = {
  Red: "text-ink-red-6",
  Amber: "text-ink-amber-6",
  Green: "text-ink-green-6",
};
