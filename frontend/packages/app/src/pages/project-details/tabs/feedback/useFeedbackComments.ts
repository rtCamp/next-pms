/**
 * External dependencies.
 */
import { useCallback } from "react";
import { stripTags } from "@next-pms/design-system";
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
import { useUser } from "@/providers/user";

interface FeedbackCommentAPIItem {
  name: string;
  comment_by: string;
  comment_email: string;
  content: string;
  creation: string;
  custom_reply_to: string | null;
}

function buildCommentTree(items: FeedbackCommentAPIItem[]): CommentNode[] {
  const nodeMap = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const item of items) {
    nodeMap.set(item.name, {
      id: item.name,
      authorId: item.comment_email,
      authorName: item.comment_by,
      content: stripTags(item.content),
      createdAt: item.creation,
      replies: [],
    });
  }

  for (const item of items) {
    const node = nodeMap.get(item.name)!;
    if (item.custom_reply_to) {
      const parent = nodeMap.get(item.custom_reply_to);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function useFeedbackComments(feedbackName: string) {
  const toast = useToasts();
  const { userId, userName } = useUser(({ state }) => ({
    userId: state.userId,
    userName: state.userName,
  }));

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall<{
    message: FeedbackCommentAPIItem[];
  }>("frappe.client.get_list", {
    doctype: "Comment",
    filters: JSON.stringify([
      ["reference_doctype", "=", "Customer Feedback"],
      ["reference_name", "=", feedbackName],
      ["comment_type", "=", "Comment"],
    ]),
    fields: JSON.stringify([
      "name",
      "comment_by",
      "comment_email",
      "content",
      "creation",
      "custom_reply_to",
    ]),
    order_by: "creation asc",
  });

  const { call: addCall, loading: isAdding } = useFrappePostCall(
    "frappe.desk.form.utils.add_comment",
  );
  const { call: editCall, loading: isEditing } = useFrappePostCall(
    "frappe.client.set_value",
  );
  const { call: deleteCall, loading: isDeleting } = useFrappePostCall(
    "frappe.client.delete",
  );

  const postComment = useCallback(
    async (comment: string, replyTo?: string) => {
      await addCall({
        reference_doctype: "Customer Feedback",
        reference_name: feedbackName,
        content: `<p>${comment}</p>`,
        comment_email: userId,
        comment_by: userName,
        ...(replyTo && { custom_reply_to: replyTo }),
      });
      await mutate();
    },
    [addCall, feedbackName, mutate, userId, userName],
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
        await editCall({
          doctype: "Comment",
          name: commentId,
          fieldname: "content",
          value: `<p>${comment}</p>`,
        });
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
        await deleteCall({ doctype: "Comment", name: commentId });
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [deleteCall, mutate, toast],
  );

  return {
    comments: buildCommentTree(data?.message ?? []),
    isLoading,
    isUpdating: isAdding || isEditing || isDeleting || isValidating,
    error,
    addComment,
    replyToComment,
    editComment,
    deleteComment,
  };
}
