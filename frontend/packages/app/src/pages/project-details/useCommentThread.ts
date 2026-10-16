/**
 * External dependencies.
 */
import { useCallback, useMemo } from "react";
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
import type { ApiComment } from "./types";

export interface CommentThreadMethods {
  list: string;
  add: string;
  update: string;
  remove: string;
}

type DocParams = Record<string, string>;

function toCommentNode(comment: ApiComment): CommentNode {
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
    replies: (comment.replies ?? []).map(toCommentNode),
  };
}

export function useCommentThread(
  methods: CommentThreadMethods,
  listParams: DocParams,
  addParams: DocParams = listParams,
) {
  const toast = useToasts();

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall<{
    message: ApiComment[];
  }>(methods.list, listParams);

  const { call: addCall, loading: isAdding } = useFrappePostCall(methods.add);
  const { call: updateCall, loading: isEditing } = useFrappePostCall(
    methods.update,
  );
  const { call: removeCall, loading: isDeleting } = useFrappePostCall(
    methods.remove,
  );

  const run = useCallback(
    async (request: () => Promise<unknown>) => {
      try {
        await request();
        await mutate();
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
        throw err;
      }
    },
    [mutate, toast],
  );

  const addComment = useCallback(
    (comment: string) => run(() => addCall({ ...addParams, comment })),
    [run, addCall, addParams],
  );

  const replyToComment = useCallback(
    (parentId: string, comment: string) =>
      run(() => addCall({ ...addParams, comment, reply_to: parentId })),
    [run, addCall, addParams],
  );

  const editComment = useCallback(
    (commentId: string, comment: string) =>
      run(() => updateCall({ comment_name: commentId, comment })),
    [run, updateCall],
  );

  const deleteComment = useCallback(
    (commentId: string) => run(() => removeCall({ comment_name: commentId })),
    [run, removeCall],
  );

  const comments = useMemo(
    () => (data?.message ?? []).map(toCommentNode),
    [data],
  );

  return {
    comments,
    isLoading,
    isUpdating: isAdding || isEditing || isDeleting || isValidating,
    error,
    addComment,
    replyToComment,
    editComment,
    deleteComment,
  };
}
