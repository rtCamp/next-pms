/**
 * External dependencies.
 */
import { useState } from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { SmallDown, SmallUp } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { NoteComment } from "../../types";
import { CommentItem } from "./commentItem";
import type { CommentActions } from "./types";

type CommentThreadProps = {
  comment: NoteComment;
} & CommentActions;

export function CommentThread({ comment, ...actions }: CommentThreadProps) {
  const [showReplies, setShowReplies] = useState(true);
  const replies = comment.replies ?? [];
  const hasReplies = replies.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <CommentItem comment={comment} canReply {...actions} />

      {hasReplies && (
        <div className="flex flex-col gap-3 border-l border-outline-gray-2 pl-4">
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            label={showReplies ? "Hide replies" : "Show replies"}
            iconLeft={showReplies ? SmallUp : SmallDown}
            onClick={() => setShowReplies((v) => !v)}
          />
          {showReplies &&
            replies.map((reply) => (
              // Replies are capped at one level, so they cannot be replied to.
              <CommentItem
                key={reply.name}
                comment={reply}
                canReply={false}
                {...actions}
              />
            ))}
        </div>
      )}
    </div>
  );
}
