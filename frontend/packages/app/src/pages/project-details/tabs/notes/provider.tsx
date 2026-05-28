import { useMemo, type PropsWithChildren } from "react";

import { NotesContext, type NotesContextProps } from "./context";
import { useNotesData } from "./useNotesData";
import { useNotesFilters } from "./useNotesFilters";

export function NotesProvider({ children }: PropsWithChildren) {
  const { filters, setAdvanced } = useNotesFilters();

  const { notes, isLoading, error } = useNotesData(filters.advanced);

  const value = useMemo<NotesContextProps>(
    () => ({
      state: { notes, isLoading, error, filters },
      actions: { setAdvanced },
    }),
    [notes, isLoading, error, filters, setAdvanced],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
