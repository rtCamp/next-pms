export type CommentActions = {
  onReply: (parentName: string, comment: string) => Promise<void>;
  onEdit: (commentName: string, comment: string) => Promise<void>;
  onDelete: (commentName: string) => Promise<void>;
  isUpdating: boolean;
  viewerUserId: string;
};
