/**
 * External dependencies.
 */
import { useState } from "react";
import { Avatar, Button, Dropdown, TextEditor } from "@rtcamp/frappe-ui-react";
import { Delete, DotHorizontal, Edit1, Reply } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { formatRelativeTimeShort } from "@/lib/utils";
import type { NoteComment } from "../../types";
import { CommentInput } from "./commentInput";
import type { CommentActions } from "./types";

type CommentItemProps = {
  comment: NoteComment;
  /** Replies are capped at one level, so only root comments can be replied to. */
  canReply: boolean;
} & CommentActions;

export function CommentItem({
  comment,
  canReply,
  onReply,
  onEdit,
  onDelete,
  isMutating,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const authorHref = `/desk/user/${encodeURIComponent(comment.user)}`;
  const timestamp = formatRelativeTimeShort(
    comment.created_at,
    new Date(),
    true,
  );

  const handleEdit = async (value: string) => {
    await onEdit(comment.name, value);
    setIsEditing(false);
  };

  const handleReply = async (value: string) => {
    await onReply(comment.name, value);
    setIsReplying(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <a href={authorHref} className="shrink-0">
            <Avatar
              size="sm"
              shape="circle"
              label={comment.user_full_name}
              image={comment.user_image || undefined}
            />
          </a>
          <span className="truncate text-base font-medium text-ink-gray-8">
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
          placeholder="Edit comment..."
          autoFocus
          isSubmitting={isMutating}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <TextEditor
          content={comment.comment}
          editable={false}
          fixedMenu={false}
          editorClass="prose prose-sm max-w-none text-ink-gray-8"
        />
      )}

      {!isEditing && (
        <div className="flex items-center gap-1">
          {canReply && (
            <Button
              variant="ghost"
              size="sm"
              label="Reply"
              iconLeft={Reply}
              disabled={isMutating}
              onClick={() => setIsReplying((v) => !v)}
            />
          )}
          <Dropdown
            placement="right"
            button={{ variant: "ghost", size: "sm", icon: DotHorizontal }}
            options={[
              {
                key: "edit",
                label: "Edit",
                icon: <Edit1 className="size-4 mr-2" />,
                disabled: isMutating,
                onClick: () => setIsEditing(true),
              },
              {
                key: "delete",
                label: "Delete",
                theme: "red",
                icon: <Delete className="size-4 mr-2" />,
                disabled: isMutating,
                onClick: () => void onDelete(comment.name),
              },
            ]}
          />
        </div>
      )}

      {isReplying && (
        <CommentInput
          placeholder="Reply..."
          autoFocus
          isSubmitting={isMutating}
          onSubmit={handleReply}
          onCancel={() => setIsReplying(false)}
        />
      )}
    </div>
  );
}
