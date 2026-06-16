/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Avatar } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { formatRelativeTimeShort, stripTags } from "@/lib/utils";
import { CommentInput } from "./commentInput";
import { ComponentActions } from "./componentActions";
import type { CommentActions, CommentNode } from "./types";

type CommentItemProps = {
  comment: CommentNode;
  canReply: boolean;
} & CommentActions;

export function CommentItem({
  comment,
  canReply,
  onReply,
  onEdit,
  onDelete,
  isUpdating,
  authorId,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const authorHref = `/desk/user/${encodeURIComponent(comment.authorId)}`;
  const timestamp = formatRelativeTimeShort(
    comment.createdAt,
    new Date(),
    true,
  );
  const isOwnedByViewer =
    Boolean(authorId) &&
    (comment.authorId === authorId || comment.ownerId === authorId);

  const handleEdit = useCallback(
    async (value: string) => {
      await onEdit(comment.id, value);
      setIsEditing(false);
    },
    [comment.id, onEdit],
  );

  const handleReply = useCallback(
    async (value: string) => {
      await onReply(comment.id, value);
      setIsReplying(false);
    },
    [comment.id, onReply],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 min-w-0 items-center gap-2">
          <a href={authorHref} className="shrink-0 flex items-center">
            <Avatar
              size="sm"
              shape="circle"
              label={comment.authorName}
              image={comment.authorImage || undefined}
            />
          </a>
          <span className="truncate text-base font-medium text-ink-gray-7">
            {comment.authorName}
          </span>
          <span className="shrink-0 text-base text-ink-gray-5">
            added a comment
          </span>
        </div>
        <span className="shrink-0 text-sm text-ink-gray-5">{timestamp}</span>
      </div>

      {isEditing ? (
        <CommentInput
          initialValue={comment.content}
          placeholder="Edit comment"
          autoFocus
          isSubmitting={isUpdating}
          submitLabel="Save"
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="rounded-lg bg-surface-gray-1">
          <p className="px-3 py-2.5 text-sm text-ink-gray-8">
            {stripTags(comment.content)}
          </p>
        </div>
      )}

      {!isEditing && (
        <ComponentActions
          onReply={
            canReply ? () => setIsReplying((value) => !value) : undefined
          }
          onEdit={isOwnedByViewer ? () => setIsEditing(true) : undefined}
          onDelete={
            isOwnedByViewer
              ? () => {
                  void onDelete(comment.id).catch(() => {});
                }
              : undefined
          }
          isUpdating={isUpdating}
        />
      )}

      {isReplying && (
        <CommentInput
          placeholder="Type a reply"
          autoFocus
          isSubmitting={isUpdating}
          submitLabel="Post"
          onSubmit={handleReply}
          onCancel={() => setIsReplying(false)}
        />
      )}
    </div>
  );
}
