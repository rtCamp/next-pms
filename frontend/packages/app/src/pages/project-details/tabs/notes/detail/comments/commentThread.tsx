/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

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
  const replies = comment.replies ?? [];
  const hasReplies = replies.length > 0;
  const canReply = depth < MAX_COMMENT_DEPTH;

  return (
    <div className="flex flex-col gap-3">
      <CommentItem comment={comment} canReply={canReply} {...actions} />

      {hasReplies && (
        <Accordion.Root
          defaultValue={[comment.name]}
          multiple
          className="flex flex-col gap-3 pl-8"
        >
          <Accordion.Item value={comment.name} className="border-none">
            <Accordion.Header render={<div />}>
              <Accordion.Trigger className="inline-flex w-29 justify-between items-center gap-1 rounded px-2 py-1 text-sm text-ink-gray-5 transition-colors hover:bg-surface-gray-2 hover:text-ink-gray-7 group">
                <span className="group-data-panel-open:hidden">
                  Show replies
                </span>
                <span className="hidden group-data-panel-open:inline">
                  Hide replies
                </span>
                <SmallDown
                  aria-hidden
                  className="size-4 shrink-0 transition-transform group-data-panel-open:rotate-180"
                />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="accordion-panel">
              <div className="flex flex-col gap-3 pt-3">
                {replies.map((reply) => (
                  <CommentThread
                    key={reply.name}
                    comment={reply}
                    depth={depth + 1}
                    {...actions}
                  />
                ))}
              </div>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      )}
    </div>
  );
}
