/**
 * External dependencies.
 */
import { Comments } from "@/components/comments";
import { useUser } from "@/providers/user";

/**
 * Internal dependencies.
 */
import { useNoteComments } from "./comments/useNoteComments";
import { mapNoteComment } from "./utils";

type NoteCommentsProps = {
  noteId: string;
};

export function NoteComments({ noteId }: NoteCommentsProps) {
  const { userId } = useUser(({ state }) => ({ userId: state.userId }));
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

  return (
    <Comments
      comments={comments.map(mapNoteComment)}
      isLoading={isLoading}
      isUpdating={isUpdating}
      authorId={userId}
      title="Comments"
      inputPlaceholder="Type a comment"
      inputSubmitLabel="Post"
      onAddComment={addComment}
      onReply={(parentId, comment) => addComment(comment, parentId)}
      onEdit={updateComment}
      onDelete={deleteComment}
    />
  );
}
