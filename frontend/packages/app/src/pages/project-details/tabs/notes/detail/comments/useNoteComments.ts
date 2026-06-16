/**
 * External dependencies.
 */
import { useCallback } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import {
  FrappeError,
  useFrappeGetCall,
  useFrappePostCall,
} from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { NoteComment } from "../../types";

/**
 * Hook to manage fetching and mutating comments for a given note.
 */
export function useNoteComments(noteId: string) {
  const toast = useToasts();

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall<{
    message: { comments: NoteComment[] };
  }>("next_pms.timesheet.api.project_status_update.get_project_status_update", {
    name: noteId,
  });

  const { call: addCall, loading: isAdding } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.add_comment_to_project_status_update",
  );
  const { call: updateCall, loading: isUpdatingComment } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.update_comment_in_project_status_update",
  );
  const { call: deleteCall, loading: isDeleting } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.delete_comment_from_project_status_update",
  );

  const addComment = useCallback(
    async (comment: string, replyTo?: string) => {
      try {
        await addCall({ name: noteId, comment, reply_to: replyTo });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [addCall, mutate, noteId, toast],
  );

  const updateComment = useCallback(
    async (commentName: string, comment: string) => {
      try {
        await updateCall({ name: noteId, comment, comment_name: commentName });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [mutate, noteId, toast, updateCall],
  );

  const deleteComment = useCallback(
    async (commentName: string) => {
      try {
        await deleteCall({ name: noteId, comment_name: commentName });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [deleteCall, mutate, noteId, toast],
  );

  return {
    comments: data?.message.comments ?? [],
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
    isUpdating: isAdding || isUpdatingComment || isDeleting || isValidating,
  };
}
