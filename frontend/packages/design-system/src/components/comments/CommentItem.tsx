/**
 * External dependencies.
 */
import * as React from "react";
import { useState } from "react";
import { MoreVertical, Edit, Trash2, Check, X } from "lucide-react";
/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../utils";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import Button from "../button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../dropdown-menu";
import TextEditor from "../text-editor";
import type { CommentItemProps } from "./types";
import type { User } from "../text-editor/types";
import Typography from "../typography";

interface CommentItemExtendedProps extends CommentItemProps {
  onFetchUsers?: (query: string) => Promise<User[]> | User[];
  enableMentions?: boolean;
}

const CommentItem = React.forwardRef<HTMLDivElement, CommentItemExtendedProps>(
  (
    {
      comment,
      onDelete,
      onUpdate,
      isEditing = false,
      onEditModeChange,
      className,
      onFetchUsers,
      enableMentions = false,
      ...props
    },
    ref
  ) => {
    const [editContent, setEditContent] = useState(comment.content);
    const [isLocalEditing, setIsLocalEditing] = useState(isEditing);

    const formatDate = (date: string | Date): string => {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return dateObj.toLocaleDateString();
    };

    const handleEdit = () => {
      setIsLocalEditing(true);
      onEditModeChange?.(comment.id, true);
    };

    const handleCancelEdit = () => {
      setEditContent(comment.content);
      setIsLocalEditing(false);
      onEditModeChange?.(comment.id, false);
    };

    const handleSaveEdit = () => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = editContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";

      if (plainText.trim() && editContent !== comment.content) {
        onUpdate?.(comment.id, editContent.trim());
      }
      setIsLocalEditing(false);
      onEditModeChange?.(comment.id, false);
    };

    const handleDelete = () => {
      onDelete?.(comment.id);
    };

    const showActions = (comment.canEdit || comment.canDelete) && (onUpdate || onDelete);

    return (
      <div
        ref={ref}
        className={mergeClassNames(
          "flex gap-3 p-4 bg-background border rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
          className
        )}
        {...props}
      >
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.userImageUrl} alt={comment.userName} />
          <AvatarFallback>{comment.userName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <Typography variant="small" className="font-medium">
                  {comment.userName}
                </Typography>
                <Typography variant="small" className="text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </Typography>
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                  <Typography variant="small" className="text-muted-foreground italic">
                    (edited)
                  </Typography>
                )}
              </div>
              <Typography variant="small" className="font-medium text-muted-foreground">
                {comment.owner}
              </Typography>
            </div>

            {showActions && !isLocalEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-auto p-1">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Comment actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {comment.canEdit && onUpdate && (
                    <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {comment.canDelete && onDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="text-destructive cursor-pointer hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mt-2">
            {isLocalEditing ? (
              <div className="space-y-2">
                <div className="border border-foreground/50 rounded-lg overflow-hidden focus-within:border-foreground/50 focus-within:ring-1 focus-within:ring-foreground/50">
                  <TextEditor
                    value={editContent}
                    onChange={setEditContent}
                    placeholder="Edit your comment..."
                    hideToolbar={true}
                    enableMentions={enableMentions}
                    onFetchUsers={onFetchUsers}
                    className="border-0 focus:ring-0 focus:border-0 [&_.ql-editor]:min-h-[80px] [&_.ql-editor]:p-3 [&_.ql-container]:border-0"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={!editContent.trim() || editContent === comment.content}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="leading-relaxed prose prose-sm max-w-none [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
                <div dangerouslySetInnerHTML={{ __html: comment.content }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CommentItem.displayName = "CommentItem";

export default CommentItem;
