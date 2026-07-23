/**
 * External dependencies.
 */
import { useCallback } from "react";
import type { CommentNode } from "@next-pms/design-system/components";
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
import type { FeedbackComment } from "./types";

function mapFeedbackComment(comment: FeedbackComment): CommentNode {
  return {
    id: comment.name,
    authorId: comment.user,
    authorName: comment.user_full_name,
    authorImage: comment.user_image,
    content: comment.comment,
    createdAt: comment.created_at,
    ownerId: comment.user,
    edited: comment.edited,
    deleted: comment.deleted,
    deletedAt: comment.deleted_at,
    replies: (comment.replies ?? []).map(mapFeedbackComment),
  };
}

export function useFeedbackComments(feedbackName: string) {
  const toast = useToasts();

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall<{
    message: FeedbackComment[];
  }>("next_pms.next_projects.api.feedback.get_feedback_comments", {
    feedback: feedbackName,
  });

  const { call: addCall, loading: isAdding } = useFrappePostCall(
    "next_pms.next_projects.api.feedback.add_comment_to_feedback",
  );
  const { call: editCall, loading: isEditing } = useFrappePostCall(
    "next_pms.next_projects.api.feedback.update_comment_in_feedback",
  );
  const { call: deleteCall, loading: isDeleting } = useFrappePostCall(
    "next_pms.next_projects.api.feedback.delete_comment_from_feedback",
  );

  const postComment = useCallback(
    async (comment: string, replyTo?: string) => {
      await addCall({
        feedback: feedbackName,
        comment,
        ...(replyTo && { reply_to: replyTo }),
      });
      await mutate();
    },
    [addCall, feedbackName, mutate],
  );

  const addComment = useCallback(
    async (comment: string) => {
      try {
        await postComment(comment);
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [postComment, toast],
  );

  const replyToComment = useCallback(
    async (parentId: string, comment: string) => {
      try {
        await postComment(comment, parentId);
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [postComment, toast],
  );

  const editComment = useCallback(
    async (commentId: string, comment: string) => {
      try {
        await editCall({ comment_name: commentId, comment });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [editCall, mutate, toast],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteCall({ comment_name: commentId });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [deleteCall, mutate, toast],
  );

  return {
    comments: (data?.message ?? []).map(mapFeedbackComment),
    isLoading,
    isUpdating: isAdding || isEditing || isDeleting || isValidating,
    error,
    addComment,
    replyToComment,
    editComment,
    deleteComment,
  };
}
