import type { FilterCondition } from "@rtcamp/frappe-ui-react";

export type NoteComment = {
  name: string;
  user: string;
  user_full_name: string;
  user_image: string | null;
  comment: string;
  created_at: string;
  modified_at: string | null;
  owner: string;
  modified_by: string;
};

export type Note = {
  name: string;
  title: string;
  description: string;
  status: string;
  project: string;
  owner: string;
  owner_full_name: string;
  owner_image: string;
  creation: string;
  modified: string;
  last_edited_at: string | null;
  last_edited_by: string | null;
  modified_by: string;
  docstatus: number;
  comments: NoteComment[];
};

export type NotesFilters = {
  advanced: FilterCondition[];
};
