import type { ProjectComment } from "@/pages/project-details/useProjectComments";

export type RagColour = "Red" | "Amber" | "Green";

export type DatePrecision = "Precise" | "Approximate";

export interface RagTrigger {
  type: string;
  type_label: string;
  colour: RagColour;
  alert: string;
  trigger_date: string | null;
  date_precision: DatePrecision;
}

export interface RagHistory extends RagTrigger {
  clear_date: string | null;
}

export type RagComment = ProjectComment;

/** The response of `rtcamp.api.project_rag.get_project_rag_details`. */
export interface RagDetails {
  project: string;
  current_status: RagColour | null;
  triggers: RagTrigger[];
  history: RagHistory[];
  comments: RagComment[];
}

export type RagColumnKey = "type" | "alert" | "trigger_date" | "clear_date";

export interface RagColumn {
  key: RagColumnKey;
  label: string;
  /** A CSS grid track size. */
  width: string;
}
