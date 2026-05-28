/**
 * External dependencies.
 */
import { useMemo, type PropsWithChildren } from "react";

/**
 * Internal dependencies.
 */
import { NotesContext, type NotesContextProps } from "./context";
import { useNotesData } from "./useNotesData";
import { useNotesFilters } from "./useNotesFilters";

export function NotesProvider({ children }: PropsWithChildren) {
  const { filters, setAdvanced } = useNotesFilters();

  const { notes, filterFields, isLoading, error } = useNotesData(
    filters.advanced,
  );

  const value = useMemo<NotesContextProps>(
    () => ({
      state: { notes, filterFields, isLoading, error, filters },
      actions: { setAdvanced },
    }),
    [notes, filterFields, isLoading, error, filters, setAdvanced],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
