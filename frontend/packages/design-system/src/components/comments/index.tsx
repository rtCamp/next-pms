/**
 * External dependencies.
 */
import { useMemo } from "react";
import { mergeClassNames as cn } from "@next-pms/design-system";

/**
 * Internal dependencies.
 */
import { CommentInput } from "./commentInput";
import { CommentThread } from "./commentThread";
import { useCommentsContext } from "./context";
import { CommentsProvider } from "./provider";
import Spinner from "../spinner";
import type { CommentNode, CommentsRootProps } from "./types";

export type {
  CommentNode,
  CommentsRootProps,
  CommentsRootProps as CommentsProps,
} from "./types";

function CommentsRoot({
  className,
  children,
  isUpdating = false,
  authorId,
  canManageAllComments = false,
  onReply,
  onEdit,
  onDelete,
}: CommentsRootProps) {
  const value = useMemo(
    () => ({
      onReply,
      onEdit,
      onDelete,
      isUpdating,
      authorId,
      canManageAllComments,
    }),
    [onReply, onEdit, onDelete, isUpdating, authorId, canManageAllComments],
  );

  return (
    <CommentsProvider {...value}>
      <div className={cn("flex flex-col gap-5", className)}>{children}</div>
    </CommentsProvider>
  );
}

function CommentsTitle({ children }: { children: React.ReactNode }) {
  if (typeof children === "string") {
    return <h2 className="text-lg font-medium text-ink-gray-8">{children}</h2>;
  }
  return <>{children}</>;
}

function CommentsList({
  comments,
  isLoading = false,
}: {
  comments: CommentNode[];
  isLoading?: boolean;
}) {
  if (isLoading) return <Spinner className="py-6" />;
  if (!comments?.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => (
        <CommentThread key={comment.id} comment={comment} />
      ))}
    </div>
  );
}

function CommentsInput({
  onSubmit,
  placeholder = "Type a comment",
  submitLabel = "Post",
  triggerClassName,
  avatarName,
  avatarImage,
}: {
  onSubmit: (comment: string) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  triggerClassName?: string;
  avatarName?: string;
  avatarImage?: string;
}) {
  const { isUpdating } = useCommentsContext();
  return (
    <CommentInput
      onSubmit={onSubmit}
      collapsible
      resetOnSubmit
      isSubmitting={isUpdating}
    >
      <CommentInput.Trigger
        placeholder={placeholder}
        className={triggerClassName}
        avatarName={avatarName}
        avatarImage={avatarImage}
      />
      <CommentInput.Content>
        <CommentInput.Editor placeholder={placeholder} />
        <CommentInput.Actions submitLabel={submitLabel} />
      </CommentInput.Content>
    </CommentInput>
  );
}

export const Comments = Object.assign(CommentsRoot, {
  Title: CommentsTitle,
  List: CommentsList,
  Input: CommentsInput,
});
