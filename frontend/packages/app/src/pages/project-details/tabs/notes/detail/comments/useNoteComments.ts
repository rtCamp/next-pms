/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
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
  const [isMutationPending, setIsMutationPending] = useState(false);

  const { data, isLoading, error, mutate } = useFrappeGetCall<{
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

  const runCommentMutation = useCallback(
    async (mutation: () => Promise<unknown>) => {
      setIsMutationPending(true);

      try {
        await mutation();
        await mutate();
      } finally {
        setIsMutationPending(false);
      }
    },
    [mutate],
  );

  const addComment = useCallback(
    async (comment: string, replyTo?: string) => {
      try {
        await runCommentMutation(() =>
          addCall({ name: noteId, comment, reply_to: replyTo }),
        );
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [addCall, noteId, runCommentMutation, toast],
  );

  const updateComment = useCallback(
    async (commentName: string, comment: string) => {
      try {
        await runCommentMutation(() =>
          updateCall({ name: noteId, comment, comment_name: commentName }),
        );
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [updateCall, noteId, runCommentMutation, toast],
  );

  const deleteComment = useCallback(
    async (commentName: string) => {
      try {
        await runCommentMutation(() =>
          deleteCall({ name: noteId, comment_name: commentName }),
        );
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [deleteCall, noteId, runCommentMutation, toast],
  );

  return {
    comments: data?.message.comments ?? [],
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
    isUpdating:
      isAdding || isUpdatingComment || isDeleting || isMutationPending,
  };
}
