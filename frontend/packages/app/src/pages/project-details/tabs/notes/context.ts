/**
 * External dependencies.
 */
import type { FilterField } from "@rtcamp/frappe-ui-react";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { Note, NotesFilters } from "./types";

export interface NotesContextProps {
  state: {
    notes: Note[];
    filterFields: FilterField[];
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
    filterFields: [],
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
