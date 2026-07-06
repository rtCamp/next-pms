export type ColumnDef<K extends string = string> = {
  key: K;
  label: string;
  width: string;
  align?: "left" | "right";
};

export type RagColour = "Red" | "Amber" | "Green";

export type DatePrecision = "Precise" | "Approximate";

export type RagTrigger = {
  type: string;
  type_label: string;
  colour: RagColour;
  alert: string;
  trigger_date: string | null;
  date_precision: DatePrecision;
};

export type RagHistory = RagTrigger & {
  clear_date: string | null;
};

export type RagComment = {
  name: string;
  user: string;
  user_full_name: string;
  user_image: string | null;
  comment: string;
  reply_to: string | null;
  created_at: string;
  modified_at: string;
  replies: RagComment[];
  reply_count: number;
};

export type RagDetails = {
  project: string;
  current_status: RagColour | null;
  triggers: RagTrigger[];
  history: RagHistory[];
  comments: RagComment[];
};
