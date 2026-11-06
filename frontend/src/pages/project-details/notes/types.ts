import type { ProjectComment } from "@/pages/project-details/useProjectComments";

export type NoteStatus = "Draft" | "Review" | "Publish";

/** A `Project Status Update` row as the Notes list reads it. */
export interface NoteRow {
  name: string;
  title: string;
  description: string;
  status: NoteStatus;
  project: string;
  pinned: number | boolean;
  creation: string;
  modified: string;
  last_edited_at: string | null;
  last_edited_by: string | null;
  owner: string;
  modified_by: string;
}

/** A note with its author's name and image. */
export interface Note extends Omit<NoteRow, "pinned"> {
  pinned: boolean;
  ownerName: string;
  ownerImage: string | null;
}

export interface NoteUser {
  name: string;
  full_name: string | null;
  user_image: string | null;
}

/** `get_project_status_update`: the note with its comment tree. */
export interface NoteDetails extends Omit<NoteRow, "pinned"> {
  pinned: number;
  owner_full_name: string;
  owner_image: string;
  comments: ProjectComment[];
}

/** The list's search and author filter. */
export interface NoteFilters {
  title: string;
  description: string;
  author: string;
}

export interface NoteSubscription {
  subscribed: boolean;
  is_account_manager: boolean;
}

/** A `Project Status Update Template`, named by its `template_name`. */
export interface NoteTemplate {
  name: string;
  template_name: string;
  title: string | null;
  description: string;
  template_description: string | null;
  category: string | null;
}

export interface NoteForm {
  title: string;
  description: string;
}

export interface TemplateForm {
  title: string;
  category: string | null;
  template_description: string;
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;
