/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";

import { CommentInput } from "./commentInput";
import { CommentThread } from "./commentThread";
import { useNoteComments } from "./useNoteComments";

type NoteCommentsProps = {
  noteId: string;
};

export function NoteComments({ noteId }: NoteCommentsProps) {
  const {
    comments,
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
    isUpdating,
  } = useNoteComments(noteId);

  if (error) throw error;

  const actions = {
    onReply: (parentName: string, comment: string) =>
      addComment(comment, parentName),
    onEdit: updateComment,
    onDelete: deleteComment,
    isUpdating,
  };

  return (
    <div className="mt-6 flex flex-col gap-5 border-t border-outline-gray-2 pt-6">
      <h2 className="text-lg font-medium text-ink-gray-8">Comments</h2>

      {isLoading ? (
        <Spinner className="py-6" />
      ) : comments?.length ? (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentThread key={comment.name} comment={comment} {...actions} />
          ))}
        </div>
      ) : null}

      <CommentInput
        placeholder="Type a comment"
        submitLabel="Post"
        collapsible
        resetOnSubmit
        isSubmitting={isUpdating}
        onSubmit={(comment) => addComment(comment)}
      />
    </div>
  );
}
