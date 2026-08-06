/**
 * External dependencies.
 */
import { useContext } from "react";
import type { CommentNode } from "@next-pms/design-system/components";
import { Comments } from "@next-pms/design-system/components";
import { FrappeContext } from "frappe-react-sdk";
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

  const frappe = useContext(FrappeContext);

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
      getMentions={async (query) => {
        const response = await frappe?.call.get(
          "next_pms.timesheet.api.employee.get_employee_list",
          {
            employee_name: query || undefined,
            page_length: 5,
            start: 0,
          },
        );

        const mentions = response.message.data.map(
          (emp: { name: string; employee_name: string }) => ({
            id: emp.name,
            label: emp.employee_name,
          }),
        );

        return mentions || [];
      }}
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
