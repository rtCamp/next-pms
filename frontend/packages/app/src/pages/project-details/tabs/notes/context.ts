import { createContext, useContextSelector } from "use-context-selector";

import type { Note, NotesFilters } from "./types";

export interface NotesContextProps {
  state: {
    notes: Note[];
    isLoading: boolean;
    error: unknown;
    filters: NotesFilters;
  };
  actions: {
    setAdvanced: (advanced: NotesFilters["advanced"]) => void;
  };
}

const noop = () => {};

export const NotesContext = createContext<NotesContextProps>({
  state: {
    notes: [],
    isLoading: false,
    error: null,
    filters: { advanced: [] },
  },
  actions: {
    setAdvanced: noop,
  },
});

export const useNotes = <T>(selector: (state: NotesContextProps) => T) =>
  useContextSelector(NotesContext, selector);
