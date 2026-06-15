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

const API = "next_pms.timesheet.api.project_status_update";

/**
 * Owns the comment tree for a single note: fetch + add/update/delete, with a
 * refetch after every mutation so the rendered thread always reflects the
 * server (replies cascade-delete server-side, so a local merge would drift).
 */
export function useNoteComments(noteId: string) {
  const toast = useToasts();

  const { data, isLoading, error, mutate } = useFrappeGetCall<{
    message: { comments: NoteComment[] };
  }>(`${API}.get_project_status_update`, { name: noteId });

  const { call: addCall, loading: isAdding } = useFrappePostCall(
    `${API}.add_comment_to_project_status_update`,
  );
  const { call: updateCall, loading: isUpdating } = useFrappePostCall(
    `${API}.update_comment_in_project_status_update`,
  );
  const { call: deleteCall, loading: isDeleting } = useFrappePostCall(
    `${API}.delete_comment_from_project_status_update`,
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
    [updateCall, mutate, noteId, toast],
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
    isUpdating: isAdding || isUpdating || isDeleting,
  };
}
