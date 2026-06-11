export type NoteComment = {
  name: string;
  user: string;
  user_full_name: string;
  user_image: string | null;
  comment: string;
  reply_to: string | null;
  created_at: string;
  modified_at: string | null;
  owner: string;
  modified_by: string;
  reply_count: number;
  replies: NoteComment[];
};

export const NOTE_STATUS = ["Draft", "Review", "Publish"] as const;
export type NoteStatus = (typeof NOTE_STATUS)[number];

export type NoteUserDetails = {
  name: string;
  full_name: string;
  user_image: string | null;
};

export type NoteAuthorOption = {
  label: string;
  value: string;
};

export type NoteFilters = {
  title: string;
  description: string;
  author: string;
};

export type Note = {
  name: string;
  title: string;
  description: string;
  status: NoteStatus;
  project: string;
  owner: string;
  owner_full_name?: string;
  owner_image?: string | null;
  creation: string;
  modified: string;
  last_edited_at: string | null;
  last_edited_by: string | null;
  modified_by: string;
  docstatus?: number;
  comments?: NoteComment[];
};
