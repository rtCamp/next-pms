/**
 * External dependencies.
 */
import { useMemo, useState, type PropsWithChildren } from "react";
import type { FilterCondition } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { NotesContext, type NotesContextProps } from "./context";
import { useNotesData } from "./useNotesData";

export function NotesProvider({ children }: PropsWithChildren) {
  const [filters, setFilters] = useState<FilterCondition[]>([]);

  const { notes, isLoading, error, mutate } = useNotesData({
    filters,
  });

  const value = useMemo<NotesContextProps>(
    () => ({
      state: { notes, isLoading, error, filters },
      actions: { setFilters, refresh: mutate },
    }),
    [notes, isLoading, error, filters, setFilters, mutate],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
