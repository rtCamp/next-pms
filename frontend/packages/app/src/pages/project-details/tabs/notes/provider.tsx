/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useToasts, type FilterCondition } from "@rtcamp/frappe-ui-react";
import { FrappeError, useFrappeDeleteDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { NotesContext, type NotesContextProps } from "./context";
import { useNotesData } from "./useNotesData";

export function NotesProvider({ children }: PropsWithChildren) {
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteDoc } = useFrappeDeleteDoc();
  const toast = useToasts();

  const { notes, isLoading, error, mutate } = useNotesData({ filters });

  const deleteNote = useCallback(
    async (name: string) => {
      setIsDeleting(true);
      try {
        await deleteDoc("Project Status Update", name);
        toast.success("Note deleted");
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setIsDeleting(false);
      }
    },
    [deleteDoc, mutate, toast],
  );

  const value = useMemo<NotesContextProps>(
    () => ({
      state: { notes, isLoading, error, filters, isDeleting },
      actions: { setFilters, refresh: mutate, deleteNote },
    }),
    [
      notes,
      isLoading,
      error,
      filters,
      isDeleting,
      setFilters,
      mutate,
      deleteNote,
    ],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
