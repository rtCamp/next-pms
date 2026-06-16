/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { CommentInput } from "./commentInput";
import { CommentThread } from "./commentThread";
import type { CommentsProps } from "./types";

export type { CommentNode, CommentsProps } from "./types";

export function Comments({
  comments,
  isLoading = false,
  isUpdating = false,
  authorId,
  title = "Comments",
  inputPlaceholder = "Type a comment",
  inputSubmitLabel = "Post",
  onAddComment,
  onReply,
  onEdit,
  onDelete,
}: CommentsProps) {
  const actions = {
    onReply,
    onEdit,
    onDelete,
    isUpdating,
    authorId,
  };

  return (
    <div className="mt-6 flex flex-col gap-5 border-t border-outline-gray-2 pt-6">
      <h2 className="text-lg font-medium text-ink-gray-8">{title}</h2>

      {isLoading ? (
        <Spinner className="py-6" />
      ) : comments?.length ? (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentThread key={comment.id} comment={comment} {...actions} />
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
  );
}
