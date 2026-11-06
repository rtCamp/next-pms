import { inject, type InjectionKey, type Ref } from "vue";
import type { CommentMention, CommentsProps } from "./types";

export interface CommentsContext {
  mentions: Ref<CommentMention[] | undefined>;
  isUpdating: Ref<boolean>;
  authorId: Ref<string | undefined>;
  canManageAllComments: Ref<boolean>;
  replyToComment: CommentsProps["replyToComment"];
  editComment: CommentsProps["editComment"];
  deleteComment: CommentsProps["deleteComment"];
}

export const commentsContextKey: InjectionKey<CommentsContext> =
  Symbol("CommentsContext");

export function useCommentsContext(): CommentsContext {
  const context = inject(commentsContextKey, null);
  if (!context) {
    throw new Error("Comments components must be used within <Comments>.");
  }
  return context;
}
