/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useUser } from "@/providers/user";
import { CommentThread } from "./commentThread";
import { CommentInput } from "./commentInput";
import { useNoteComments } from "./useNoteComments";

type NoteCommentsProps = {
  noteId: string;
};

export function NoteComments({ noteId }: NoteCommentsProps) {
  const userName = useUser((s) => s.state.userName);
  const userImage = useUser((s) => s.state.image);
  const {
    comments,
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
    isMutating,
  } = useNoteComments(noteId);

  if (error) throw error;

  const actions = {
    onReply: (parentName: string, comment: string) =>
      addComment(comment, parentName),
    onEdit: updateComment,
    onDelete: deleteComment,
    isMutating,
  };

  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-outline-gray-2 pt-6">
      <h2 className="text-xl font-semibold text-ink-gray-8">Comments</h2>

      {isLoading ? (
        <Spinner className="py-6" />
      ) : (
        comments.map((comment) => (
          <CommentThread key={comment.name} comment={comment} {...actions} />
        ))
      )}

      <CommentInput
        placeholder="Add a comment..."
        resetOnSubmit
        isSubmitting={isMutating}
        avatar={{ label: userName, image: userImage }}
        onSubmit={(comment) => addComment(comment)}
      />
    </div>
  );
}
