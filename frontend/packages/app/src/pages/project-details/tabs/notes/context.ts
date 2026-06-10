/**
 * External dependencies.
 */
import { Dispatch, SetStateAction } from "react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { Note } from "./types";

export interface NotesContextProps {
  state: {
    notes: Note[];
    isLoading: boolean;
    error: unknown;
    filters: FilterCondition[];
    isDeleting: boolean;
  };
  actions: {
    setFilters: Dispatch<SetStateAction<FilterCondition[]>>;
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
    filters: [],
    isDeleting: false,
  },
  actions: {
    setFilters: noop,
    refresh: async () => undefined,
    deleteNote: async () => undefined,
  },
});

export const useNotes = <T>(selector: (state: NotesContextProps) => T) =>
  useContextSelector(NotesContext, selector);
