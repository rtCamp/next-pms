export type CommentNode = {
  id: string;
  authorId: string;
  authorName: string;
  authorImage?: string | null;
  content: string;
  createdAt: string;
  ownerId?: string | null;
  replies: CommentNode[];
};

export type CommentActions = {
  onReply: (parentId: string, comment: string) => Promise<void>;
  onEdit: (commentId: string, comment: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isUpdating: boolean;
  authorId?: string;
  canManageAllComments?: boolean;
};

export type CommentsProps = {
  comments: CommentNode[];
  isLoading?: boolean;
  isUpdating?: boolean;
  authorId?: string;
  canManageAllComments?: boolean;
  className?: string;
  title?: string;
  titleClassName?: string;
  inputPlaceholder?: string;
  inputSubmitLabel?: string;
  inputTriggerClassName?: string;
  inputAvatarName?: string;
  inputAvatarImage?: string | null;
  onAddComment: (comment: string) => Promise<void>;
  onReply: (parentId: string, comment: string) => Promise<void>;
  onEdit: (commentId: string, comment: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
};
