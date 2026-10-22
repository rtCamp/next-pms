/**
 * External dependencies.
 */
import { useMemo } from "react";
import { Comments } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { useMentionSuggestions } from "@/hooks/useMentionSuggestions";
import { useCommentThread } from "@/pages/project-details/useCommentThread";
import { useUser } from "@/providers/user";
import { GROWTH_COMMENT_METHODS } from "../constants";

interface GrowthCommentsProps {
  growthId: string;
}

export function GrowthComments({ growthId }: GrowthCommentsProps) {
  const params = useMemo(() => ({ name: growthId }), [growthId]);
  const {
    comments,
    isLoading,
    isUpdating,
    addComment,
    replyToComment,
    editComment,
    deleteComment,
  } = useCommentThread(GROWTH_COMMENT_METHODS, params);
  const getMentions = useMentionSuggestions();
  const { userId, currentUser, userName, userImage } = useUser(({ state }) => ({
    userId: state.userId,
    currentUser: state.currentUser,
    userName: state.userName,
    userImage: state.image,
  }));

  return (
    <Comments
      getMentions={getMentions}
      comments={comments}
      isLoading={isLoading}
      isUpdating={isUpdating}
      authorId={userId}
      canManageAllComments={currentUser === "Administrator"}
      titleClassName="text-ink-gray-7"
      inputPlaceholder="Add a comment, use @ to mention someone"
      inputAvatarName={userName}
      inputAvatarImage={userImage}
      onAddComment={addComment}
      onReply={replyToComment}
      onEdit={editComment}
      onDelete={deleteComment}
    />
  );
}
