/**
 * External dependencies.
 */
import { useContext } from "react";
import { Comments } from "@next-pms/design-system/components";
import { FrappeContext } from "frappe-react-sdk";
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

  const frappe = useContext(FrappeContext);

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
      comments={comments.map(mapNoteComment)}
      isLoading={isLoading}
      isUpdating={isUpdating}
      authorId={userId}
      canManageAllComments={currentUser === "Administrator"}
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
