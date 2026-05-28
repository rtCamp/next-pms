/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { NotesContext, type NotesContextProps } from "./context";
import type { NotesFilters } from "./types";
import { useNotesData } from "./useNotesData";

const defaultFilters: NotesFilters = { advanced: [] };

export function NotesProvider({ children }: PropsWithChildren) {
  const [filters, setFilters] = useState<NotesFilters>(defaultFilters);

  const { notes, filterFields, isLoading, error, mutate } = useNotesData(
    filters.advanced,
  );

  const setAdvanced = useCallback((advanced: FilterCondition[]) => {
    setFilters({ advanced });
  }, []);

  const value = useMemo<NotesContextProps>(
    () => ({
      state: { notes, filterFields, isLoading, error, filters },
      actions: { setAdvanced, refresh: mutate },
    }),
    [notes, filterFields, isLoading, error, filters, setAdvanced, mutate],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
