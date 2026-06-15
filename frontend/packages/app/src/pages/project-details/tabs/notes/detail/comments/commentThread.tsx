/**
 * External dependencies.
 */
import { useState } from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { SmallDown, SmallUp } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { CommentItem } from "./commentItem";
import type { CommentActions } from "./types";
import type { NoteComment } from "../../types";

const MAX_COMMENT_DEPTH = 5;

type CommentThreadProps = {
  comment: NoteComment;
  depth?: number;
} & CommentActions;

export function CommentThread({
  comment,
  depth = 0,
  ...actions
}: CommentThreadProps) {
  const [showReplies, setShowReplies] = useState(true);
  const replies = comment.replies ?? [];
  const hasReplies = replies.length > 0;
  const canReply = depth < MAX_COMMENT_DEPTH;

  return (
    <div className="flex flex-col gap-3">
      <CommentItem comment={comment} canReply={canReply} {...actions} />

      {hasReplies && (
        <div className="flex flex-col gap-3 pl-8">
          <Button
            variant="ghost"
            iconRight={() =>
              showReplies ? (
                <SmallUp className="size-4" />
              ) : (
                <SmallDown className="size-4" />
              )
            }
            label={showReplies ? "Hide replies" : "Show replies"}
            className="inline-flex w-29 items-center justify-between gap-1 rounded px-2 py-1 text-sm text-ink-gray-5 transition-colors hover:bg-surface-gray-2 hover:text-ink-gray-7"
            onClick={() => setShowReplies((value) => !value)}
          />
          {showReplies &&
            replies.map((reply) => (
              <CommentThread
                key={reply.name}
                comment={reply}
                depth={depth + 1}
                {...actions}
              />
            ))}
        </div>
      )}
    </div>
  );
}
