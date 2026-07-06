/**
 * External dependencies.
 */
import type { CommentNode } from "@next-pms/design-system/components";
import { Comments } from "@next-pms/design-system/components";
import { useUser } from "@/providers/user";

/**
 * Internal dependencies.
 */
import type { RagComment } from "./types";
import { useRagComments } from "./useRagComments";

function mapRagComment(comment: RagComment): CommentNode {
  return {
    id: comment.name,
    authorId: comment.user,
    authorName: comment.user_full_name,
    authorImage: comment.user_image,
    content: comment.comment,
    createdAt: comment.created_at,
    replies: comment.replies.map(mapRagComment),
  };
}

export function RagComments() {
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
  } = useRagComments();

  if (error) throw error;

  return (
    <Comments
      comments={comments.map(mapRagComment)}
      isLoading={isLoading}
      isUpdating={isUpdating}
      authorId={userId}
      canManageAllComments={currentUser === "Administrator"}
      title="Comments"
      inputPlaceholder="Add a comment"
      inputSubmitLabel="Post"
      onAddComment={addComment}
      onReply={(parentId, comment) => addComment(comment, parentId)}
      onEdit={updateComment}
      onDelete={deleteComment}
    />
  );
}
