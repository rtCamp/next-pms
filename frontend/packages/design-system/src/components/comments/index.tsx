/**
 * External dependencies.
 */
import { useMemo } from "react";

/**
 * Internal dependencies.
 */
import { CommentInput } from "./commentInput";
import { CommentThread } from "./commentThread";
import { CommentsProvider } from "./provider";
import Spinner from "../spinner";
import type { CommentsProps } from "./types";

export type { CommentNode, CommentsProps } from "./types";

export function Comments({
  comments,
  isLoading = false,
  isUpdating = false,
  authorId,
  canManageAllComments = false,
  title = "Comments",
  inputPlaceholder = "Type a comment",
  inputSubmitLabel = "Post",
  onAddComment,
  onReply,
  onEdit,
  onDelete,
}: CommentsProps) {
  const value = useMemo(
    () => ({
      onReply,
      onEdit,
      onDelete,
      isUpdating,
      authorId,
      canManageAllComments,
    }),
    [onReply, onEdit, onDelete, isUpdating, authorId, canManageAllComments],
  );

  return (
    <CommentsProvider {...value}>
      <div className="mt-6 flex flex-col gap-5 border-t border-outline-gray-2 pt-6">
        <h2 className="text-lg font-medium text-ink-gray-8">{title}</h2>

        {isLoading ? (
          <Spinner className="py-6" />
        ) : comments?.length ? (
          <div className="flex flex-col gap-3">
            {comments.map((comment) => (
              <CommentThread key={comment.id} comment={comment} />
            ))}
          </div>
        ) : null}

        <CommentInput
          placeholder={inputPlaceholder}
          submitLabel={inputSubmitLabel}
          collapsible
          resetOnSubmit
          isSubmitting={isUpdating}
          onSubmit={onAddComment}
        />
      </div>
    </CommentsProvider>
  );
}
