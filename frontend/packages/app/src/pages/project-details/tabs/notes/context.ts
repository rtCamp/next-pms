/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { Note, NoteAuthorOption, NoteFilters } from "./types";

export interface NotesContextProps {
  state: {
    notes: Note[];
    isLoading: boolean;
    error: unknown;
    filters: NoteFilters;
    isUpdating: boolean;
    authorOptions: NoteAuthorOption[];
    deleteNoteName: string | null;
  };
  actions: {
    setTitleInput: (value: string) => void;
    setDescriptionInput: (value: string) => void;
    setAuthor: (value: string) => void;
    refresh: () => Promise<unknown>;
    deleteNote: (name: string) => Promise<boolean>;
    togglePin: (name: string) => Promise<void>;
    openDeleteDialog: (name: string) => void;
    closeDeleteDialog: () => void;
  };
}

const noop = () => {};

export const NotesContext = createContext<NotesContextProps>({
  state: {
    notes: [],
    isLoading: false,
    error: null,
    filters: {
      title: "",
      description: "",
      author: "",
    },
    isUpdating: false,
    authorOptions: [],
    deleteNoteName: null,
  },
  actions: {
    setTitleInput: noop,
    setDescriptionInput: noop,
    setAuthor: noop,
    refresh: async () => undefined,
    deleteNote: async () => false,
    togglePin: async () => undefined,
    openDeleteDialog: noop,
    closeDeleteDialog: noop,
  },
});

export const useNotes = <T>(selector: (state: NotesContextProps) => T) =>
  useContextSelector(NotesContext, selector);
