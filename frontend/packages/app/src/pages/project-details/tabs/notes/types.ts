import type { FilterCondition } from "@rtcamp/frappe-ui-react";

export type NoteAuthor = {
  name: string;
  email: string;
  avatar?: string;
};

export type Note = {
  id: string;
  title: string;
  excerpt: string;
  createdAt: string;
  author: NoteAuthor;
};

export type NotesFilters = {
  advanced: FilterCondition[];
};
