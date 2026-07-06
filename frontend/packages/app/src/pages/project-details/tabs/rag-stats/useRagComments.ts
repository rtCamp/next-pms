/**
 * External dependencies.
 */
import { useCallback } from "react";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { FrappeError, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectRagDetails } from "./useProjectRagDetails";
import { useProjectDetail } from "../../context";

export function useRagComments() {
  const toast = useToasts();
  const projectId = useProjectDetail((s) => s.projectId);
  const { details, isLoading, isValidating, error, mutate } =
    useProjectRagDetails();

  const { call: addCall, loading: isAdding } = useFrappePostCall(
    "rtcamp.api.project_rag.add_project_rag_comment",
  );
  const { call: updateCall, loading: isUpdatingComment } = useFrappePostCall(
    "rtcamp.api.project_rag.update_project_rag_comment",
  );
  const { call: deleteCall, loading: isDeleting } = useFrappePostCall(
    "rtcamp.api.project_rag.delete_project_rag_comment",
  );

  const addComment = useCallback(
    async (comment: string, replyTo?: string) => {
      try {
        await addCall({ project: projectId, comment, reply_to: replyTo });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [addCall, mutate, projectId, toast],
  );

  const updateComment = useCallback(
    async (commentName: string, comment: string) => {
      try {
        await updateCall({
          project: projectId,
          comment_name: commentName,
          comment,
        });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [mutate, projectId, toast, updateCall],
  );

  const deleteComment = useCallback(
    async (commentName: string) => {
      try {
        await deleteCall({ project: projectId, comment_name: commentName });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [deleteCall, mutate, projectId, toast],
  );

  return {
    comments: details?.comments ?? [],
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
    isUpdating: isAdding || isUpdatingComment || isDeleting || isValidating,
  };
}
