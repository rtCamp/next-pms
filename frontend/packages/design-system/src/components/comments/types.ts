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

export type CommentsRootProps = {
  className?: string;
  children?: React.ReactNode;
  isUpdating?: boolean;
  authorId?: string;
  canManageAllComments?: boolean;
  onReply: (parentId: string, comment: string) => Promise<void>;
  onEdit: (commentId: string, comment: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
};

export type CommentInputContextValue = {
  draft: string;
  setDraft: (v: string) => void;
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
  editorKey: number;
  isEmpty: boolean;
  isSubmitting: boolean;
  autoFocus: boolean;
  collapsible: boolean;
  showCancel: boolean;
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
};
