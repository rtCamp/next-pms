/**
 * External dependencies.
 */
import { Comments } from "@next-pms/design-system/components";
import { useUser } from "@/providers/user";

/**
 * Internal dependencies.
 */
import { mapNoteComment } from "../utils";
import { useNoteComments } from "./useNoteComments";

type NoteCommentsProps = {
  noteId: string;
};

export function NoteComments({ noteId }: NoteCommentsProps) {
  const { userId, currentUser } = useUser(({ state }) => ({
    userId: state.userId,
    currentUser: state.currentUser,
  }));

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
      className="mt-6 border-t border-outline-gray-2 pt-6"
      isUpdating={isUpdating}
      authorId={userId}
      canManageAllComments={currentUser === "Administrator"}
      onReply={(parentId, comment) => addComment(comment, parentId)}
      onEdit={updateComment}
      onDelete={deleteComment}
    >
      <Comments.Title>Comments</Comments.Title>
      <Comments.List
        comments={comments.map(mapNoteComment)}
        isLoading={isLoading}
      />
      <Comments.Input
        placeholder="Type a comment"
        submitLabel="Post"
        onSubmit={addComment}
      />
    </Comments>
  );
}
