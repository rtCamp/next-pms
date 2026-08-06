/**
 * External dependencies.
 */
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { useSearchParams } from "react-router";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useDebounce } from "@/hooks/useDebounce";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { NOTE_PARAM } from "./constants";
import { NotesContext, type NotesContextProps } from "./context";
import type { NoteUpdateInput } from "./types";
import { useNotesData } from "./useNotesData";

export function NotesProvider({ children }: PropsWithChildren) {
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [author, setAuthor] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteNoteName, setDeleteNoteName] = useState<string | null>(null);
  const [, setSearchParams] = useSearchParams();
  const { call: updateNoteCall } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.update_project_status_update",
  );
  const { call: deleteNoteCall } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.delete_project_status_update",
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

  const { notes, isLoading, error, refresh, authorOptions } =
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
        await deleteNoteCall({ name });
        toast.success("Note deleted");
        await refresh();
        setSearchParams((prev) => {
          prev.delete(NOTE_PARAM);
          return prev;
        });
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setIsUpdating(false);
      }
    },
    [deleteNoteCall, refresh, toast, setSearchParams],
  );

  const togglePin = useCallback(
    async (name: string) => {
      const note = notes.find((item) => item.name === name);

      if (!note) return;
      setIsUpdating(true);
      try {
        await updateNoteCall({
          name,
          pinned: !note.pinned,
        });
        toast.success(note.pinned ? "Note unpinned" : "Note pinned");
        await refresh();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      } finally {
        setIsUpdating(false);
      }
    },
    [notes, refresh, toast, updateNoteCall],
  );

  const updateNote = useCallback(
    async (name: string, values: NoteUpdateInput) => {
      try {
        await updateNoteCall({ name, ...values });
        await refresh();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [refresh, toast, updateNoteCall],
  );

  const openDeleteDialog = useCallback((name: string) => {
    setDeleteNoteName(name);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteNoteName(null);
  }, []);

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
        deleteNoteName,
      },
      actions: {
        setTitleInput: handleTitleInputChange,
        setDescriptionInput: handleDescriptionInputChange,
        setAuthor: handleAuthorChange,
        refresh,
        deleteNote,
        togglePin,
        updateNote,
        openDeleteDialog,
        closeDeleteDialog,
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
      deleteNoteName,
      handleTitleInputChange,
      handleDescriptionInputChange,
      handleAuthorChange,
      refresh,
      deleteNote,
      togglePin,
      updateNote,
      openDeleteDialog,
      closeDeleteDialog,
    ],
  );

  return (
    <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
  );
}
