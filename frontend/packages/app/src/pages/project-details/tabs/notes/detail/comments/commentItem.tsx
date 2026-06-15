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
import type { CommentActions } from "./types";
import type { NoteComment } from "../../types";

type CommentItemProps = {
  comment: NoteComment;
  canReply: boolean;
} & CommentActions;

export function CommentItem({
  comment,
  canReply,
  onReply,
  onEdit,
  onDelete,
  isUpdating,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const authorHref = `/desk/user/${encodeURIComponent(comment.user)}`;
  const timestamp = formatRelativeTimeShort(
    comment.created_at,
    new Date(),
    true,
  );

  const handleEdit = useCallback(
    async (value: string) => {
      await onEdit(comment.name, value);
      setIsEditing(false);
    },
    [comment.name, onEdit],
  );

  const handleReply = useCallback(
    async (value: string) => {
      await onReply(comment.name, value);
      setIsReplying(false);
    },
    [comment.name, onReply],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 min-w-0 items-center gap-2">
          <a href={authorHref} className="shrink-0 flex items-center">
            <Avatar
              size="sm"
              shape="circle"
              label={comment.user_full_name}
              image={comment.user_image || undefined}
            />
          </a>
          <span className="truncate text-base font-medium text-ink-gray-7">
            {comment.user_full_name}
          </span>
          <span className="shrink-0 text-base text-ink-gray-5">
            added a comment
          </span>
        </div>
        <span className="shrink-0 text-sm text-ink-gray-5">{timestamp}</span>
      </div>

      {isEditing ? (
        <CommentInput
          initialValue={comment.comment}
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
            {stripTags(comment.comment)}
          </p>
        </div>
      )}

      {!isEditing && (
        <ComponentActions
          onReply={
            canReply ? () => setIsReplying((value) => !value) : undefined
          }
          onEdit={() => setIsEditing(true)}
          onDelete={() => {
            void onDelete(comment.name).catch(() => {});
          }}
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
