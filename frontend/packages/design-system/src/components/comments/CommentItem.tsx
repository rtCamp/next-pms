/**
 * External dependencies.
 */
import * as React from "react";
import { useState } from "react";
import { MoreHorizontal, Edit, Trash2, Save, X, Forward } from "lucide-react";
/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../utils";
import { formatDate } from "../../utils/date";
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
  activeCommentName?: string;
}

const CommentItem = React.forwardRef<HTMLDivElement, CommentItemExtendedProps>(
  (
    {
      comment,
      onDelete,
      onUpdate,
      onShare,
      isEditing = false,
      onEditModeChange,
      className,
      onFetchUsers,
      mentionClassName,
      enableMentions = false,
      activeCommentName,
      ...props
    },
    ref
  ) => {
    const [editContent, setEditContent] = useState(comment.content);
    const [isLocalEditing, setIsLocalEditing] = useState(isEditing);

    const handleEdit = () => {
      setIsLocalEditing(true);
      onEditModeChange?.(comment.name, true);
    };

    const handleCancelEdit = () => {
      setEditContent(comment.content);
      setIsLocalEditing(false);
      onEditModeChange?.(comment.name, false);
    };

    const handleSaveEdit = () => {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = editContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";

      if (plainText.trim() && editContent !== comment.content) {
        onUpdate?.(comment.name, editContent.trim());
      }
      setIsLocalEditing(false);
      onEditModeChange?.(comment.name, false);
    };

    const handleDelete = () => {
      onDelete?.(comment.name);
    };

    const showActions = (comment.canEdit || comment.canDelete) && (onUpdate || onDelete);

    React.useEffect(() => {
      if (activeCommentName === comment.name) {
        const element = document.getElementById(comment?.name);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }, [activeCommentName, comment.name]);

    const handleShareComment = () => {
      onShare?.(comment.name);
    };

    return (
      <div
        id={comment.name}
        ref={ref}
        className={mergeClassNames(
          "flex gap-3 p-4 bg-background border rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
          className,
          activeCommentName === comment.name && "blinking-border"
        )}
        {...props}
      >
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={comment.userImageUrl} alt={comment.userName} />
          <AvatarFallback>{comment.userName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col truncate max-md:max-w-[8rem]">
              <div className="flex items-center gap-2 flex-wrap">
                <Typography title={comment.userName} variant="small" className="font-medium truncate ">
                  {comment.userName}
                </Typography>
                <Typography title={formatDate(comment.createdAt)} variant="small" className="text-muted-foreground ">
                  {formatDate(comment.createdAt)}
                </Typography>
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                  <Typography variant="small" className="text-muted-foreground italic">
                    (edited)
                  </Typography>
                )}
              </div>
              <Typography title={comment.owner} variant="small" className="font-medium text-muted-foreground">
                {comment.owner}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleShareComment} variant="ghost" size="sm" className="h-auto p-1">
                <Forward className="scale-x-[-1]" />
                <span className="sr-only">Share</span>
              </Button>
              {showActions && !isLocalEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <MoreHorizontal className="" />
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
          </div>

          <div className="mt-2">
            {isLocalEditing ? (
              <div className="space-y-2">
                <div className="border rounded-lg overflow-hidden focus-within:border-foreground/50 focus-within:ring-1 focus-within:ring-foreground/50">
                  <TextEditor
                    value={editContent}
                    onChange={setEditContent}
                    placeholder="Edit your comment..."
                    hideToolbar={true}
                    enableMentions={enableMentions}
                    onFetchUsers={onFetchUsers}
                    mentionClassName={mentionClassName}
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
                    <Save className="mr-1 h-3 w-3" />
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
