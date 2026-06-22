/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Avatar, StaticTextEditor } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { CommentInput } from "./commentInput";
import { ComponentActions } from "./componentActions";
import { useCommentsContext } from "./context";
import type { CommentNode } from "./types";
import { formatRelativeTimeShort } from "../../utils";

type CommentItemProps = {
  comment: CommentNode;
  canReply: boolean;
};

export function CommentItem({ comment, canReply }: CommentItemProps) {
  const {
    onReply,
    onEdit,
    onDelete,
    isUpdating,
    authorId,
    canManageAllComments = false,
  } = useCommentsContext();
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
  const canManageComment = isOwnedByViewer || canManageAllComments;

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
        <div className="rounded-lg bg-surface-gray-1 px-3">
          <StaticTextEditor content={comment.content} editorClass="prose-sm" />
        </div>
      )}

      {!isEditing && (
        <ComponentActions
          onReply={
            canReply ? () => setIsReplying((value) => !value) : undefined
          }
          onEdit={canManageComment ? () => setIsEditing(true) : undefined}
          onDelete={
            canManageComment
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
