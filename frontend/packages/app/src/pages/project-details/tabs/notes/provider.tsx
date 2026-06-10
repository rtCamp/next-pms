/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { FrappeError, useFrappeDeleteDoc } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { NotesContext, type NotesContextProps } from "./context";
import { useNotesData } from "./useNotesData";

export function NotesProvider({ children }: PropsWithChildren) {
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteDoc } = useFrappeDeleteDoc();
  const toast = useToasts();
  const debouncedTitleInput = useDebounce(titleInput, 400);
  const debouncedDescriptionInput = useDebounce(descriptionInput, 400);

  const filters = useMemo(
    () => ({
      title: debouncedTitleInput,
      description: debouncedDescriptionInput,
    }),
    [debouncedTitleInput, debouncedDescriptionInput],
  );

  const { notes, isLoading, error, mutate } = useNotesData(filters);

  const handleTitleInputChange = useCallback((value: string) => {
    setTitleInput(value);
  }, []);

  const handleDescriptionInputChange = useCallback((value: string) => {
    setDescriptionInput(value);
  }, []);

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
      state: {
        notes,
        isLoading,
        error,
        filters: {
          title: titleInput,
          description: descriptionInput,
        },
        isDeleting,
      },
      actions: {
        setTitleInput: handleTitleInputChange,
        setDescriptionInput: handleDescriptionInputChange,
        refresh: mutate,
        deleteNote,
      },
    }),
    [
      notes,
      isLoading,
      error,
      titleInput,
      descriptionInput,
      isDeleting,
      handleTitleInputChange,
      handleDescriptionInputChange,
      mutate,
      deleteNote,
    ],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
