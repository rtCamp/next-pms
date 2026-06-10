/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { Note, NoteFilters } from "./types";

export interface NotesContextProps {
  state: {
    notes: Note[];
    isLoading: boolean;
    error: unknown;
    filters: NoteFilters;
    isDeleting: boolean;
  };
  actions: {
    setTitleInput: (value: string) => void;
    setDescriptionInput: (value: string) => void;
    refresh: () => Promise<unknown>;
    deleteNote: (name: string) => Promise<void>;
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
    },
    isDeleting: false,
  },
  actions: {
    setTitleInput: noop,
    setDescriptionInput: noop,
    refresh: async () => undefined,
    deleteNote: async () => undefined,
  },
});

export const useNotes = <T>(selector: (state: NotesContextProps) => T) =>
  useContextSelector(NotesContext, selector);
