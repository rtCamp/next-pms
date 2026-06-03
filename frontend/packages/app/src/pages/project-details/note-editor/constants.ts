import { ROUTES } from "@/lib/constant";

export const NOTE_EDITOR_NEW_PATH = `${ROUTES.project}/:projectId/notes/new`;
export const NOTE_EDITOR_EDIT_PATH = `${ROUTES.project}/:projectId/notes/:noteId/edit`;

export const buildNewNotePath = (projectId: string) =>
  `${ROUTES.project}/${projectId}/notes/new`;

export const buildEditPath = (projectId: string, noteId: string) =>
  `${ROUTES.project}/${projectId}/notes/${encodeURIComponent(noteId)}/edit`;

export const buildNotesGridPath = (projectId: string) =>
  `${ROUTES.project}/${projectId}?tab=notes`;
