/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeDeleteDoc,
  useFrappePostCall,
} from "frappe-react-sdk";

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
  const [author, setAuthor] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { deleteDoc } = useFrappeDeleteDoc();
  const { call: updateNote } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.update_project_status_update",
  );
  const toast = useToasts();
  const debouncedTitleInput = useDebounce(titleInput, 400);
  const debouncedDescriptionInput = useDebounce(descriptionInput, 400);

  const filters = useMemo(
    () => ({
      title: debouncedTitleInput,
      description: debouncedDescriptionInput,
      author,
    }),
    [debouncedTitleInput, debouncedDescriptionInput, author],
  );

  const { notes, isLoading, error, mutate, authorOptions } =
    useNotesData(filters);

  const handleTitleInputChange = useCallback((value: string) => {
    setTitleInput(value);
  }, []);

  const handleDescriptionInputChange = useCallback((value: string) => {
    setDescriptionInput(value);
  }, []);

  const handleAuthorChange = useCallback((value: string) => {
    setAuthor(value);
  }, []);

  const deleteNote = useCallback(
    async (name: string) => {
      setIsUpdating(true);
      try {
        await deleteDoc("Project Status Update", name);
        toast.success("Note deleted");
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setIsUpdating(false);
      }
    },
    [deleteDoc, mutate, toast],
  );

  const togglePin = useCallback(
    async (name: string) => {
      const note = notes.find((item) => item.name === name);

      if (!note) return;
      setIsUpdating(true);
      try {
        await updateNote({
          name,
          pinned: !note.pinned,
        });
        toast.success(note.pinned ? "Note unpinned" : "Note pinned");
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setIsUpdating(false);
      }
    },
    [mutate, notes, toast, updateNote],
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
          author,
        },
        isUpdating,
        authorOptions,
      },
      actions: {
        setTitleInput: handleTitleInputChange,
        setDescriptionInput: handleDescriptionInputChange,
        setAuthor: handleAuthorChange,
        refresh: mutate,
        deleteNote,
        togglePin,
      },
    }),
    [
      notes,
      isLoading,
      error,
      titleInput,
      descriptionInput,
      author,
      isUpdating,
      authorOptions,
      handleTitleInputChange,
      handleDescriptionInputChange,
      handleAuthorChange,
      mutate,
      deleteNote,
      togglePin,
    ],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
