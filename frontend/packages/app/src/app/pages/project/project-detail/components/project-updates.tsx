/**
 * External dependencies
 */
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { formatDate } from "@next-pms/design-system";
import {
  Input,
  TextEditor,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Typography,
  Comments,
  type Comment,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Skeleton,
  useToast,
  Badge,
} from "@next-pms/design-system/components";
import type { User } from "@next-pms/design-system/components";
import { FrappeError, useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Calendar, Edit3, X, ChevronDown, ChevronUp, Save } from "lucide-react";

/**
 * Internal dependencies
 */
import { mergeClassNames, parseFrappeErrorMsg } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils";
import { RootState } from "@/store";
import { ProjectComment, ProjectUpdate } from "../../types";
import { convertProjectCommentToComment, getInitials } from "../../utils";

interface ProjectUpdatesProps {
  projectId?: string;
  className?: string;
}

const ProjectUpdates = ({ projectId, className }: ProjectUpdatesProps) => {
  const { toast } = useToast();
  const user = useSelector((state: RootState) => state.user);
  const [searchParams] = useSearchParams();

  const [isOpenSaveChanges, setIsOpenSaveChanges] = useState(false);
  const [projectUpdate, setProjectUpdate] = useState<ProjectUpdate | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const {
    data: projectUpdatesData,
    mutate: refetchProjectUpdate,
    isLoading,
  } = useFrappeGetCall(
    "next_pms.timesheet.api.project_status_update.get_project_status_updates_by_project",
    { project: projectId },
    projectId ? undefined : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const { call: saveProjectUpdate, loading: isSaving } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.save_project_status_update"
  );

  const { call: addComment, loading: isAddingComment } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.add_comment_to_project_status_update"
  );

  const { call: updateComment, loading: isUpdatingComment } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.update_comment_in_project_status_update"
  );

  const { call: deleteComment, loading: isDeletingComment } = useFrappePostCall(
    "next_pms.timesheet.api.project_status_update.delete_comment_from_project_status_update"
  );

  const { call: fetchUsersAPI } = useFrappePostCall("frappe.client.get_list");

  useEffect(() => {
    if (projectUpdatesData?.message && projectUpdatesData.message.length > 0) {
      const latestUpdate = projectUpdatesData.message[0];
      setProjectUpdate(latestUpdate);
      setEditTitle(latestUpdate.title);
      setEditDescription(latestUpdate.description);

      const convertedComments = latestUpdate.comments.map((comment: ProjectComment) =>
        convertProjectCommentToComment(comment, user.user)
      );
      setComments(convertedComments);
    } else if (projectUpdatesData?.message && projectId) {
      setProjectUpdate(null);
      setComments([]);
    }
  }, [projectUpdatesData, user.user, projectId]);

  const handleSave = async (status?: string) => {
    if (!projectId) return;

    const titleToSave = editingTitle ? editTitle.trim() : projectUpdate?.title || "";
    const descriptionToSave = editingDescription ? editDescription.trim() : projectUpdate?.description || "";
    const statusToSave = status || projectUpdate?.status || "Draft";

    if (!titleToSave.trim()) {
      toast({
        description: "Project Update title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await saveProjectUpdate({
        project: projectId,
        title: titleToSave,
        description: descriptionToSave || "<p>Share your project updates here...</p>",
        status: statusToSave,
        ...(projectUpdate && { name: projectUpdate.name }),
      });

      if (result?.message) {
        setProjectUpdate(result.message);
        setEditTitle(result.message.title);
        setEditDescription(result.message.description);
        setEditingTitle(false);
        setEditingDescription(false);

        const convertedComments = result.message.comments.map((comment: ProjectComment) =>
          convertProjectCommentToComment(comment, user.user)
        );
        setComments(convertedComments);
        toast({
          description: "Project Status Update saved successfully",
          variant: "success",
        });
        refetchProjectUpdate();
      }
    } catch (error) {
      const err = parseFrappeErrorMsg(error as FrappeError);
      toast({
        description: err,
        variant: "destructive",
      });
    }
  };

  const handleCancelTitle = () => {
    setEditTitle(projectUpdate?.title || "");
    setEditingTitle(false);
  };

  const handleCancelDescription = () => {
    setEditDescription(projectUpdate?.description || "");
    setEditingDescription(false);
  };

  const handleEditTitle = () => {
    setEditTitle(projectUpdate?.title || "");
    setEditingTitle(true);
  };

  const handleEditDescription = () => {
    setEditDescription(projectUpdate?.description || "");
    setEditingDescription(true);
  };

  const handleCommentSubmit = async (content: string): Promise<void> => {
    if (!projectUpdate) return;

    setIsSubmittingComment(true);

    try {
      const result = await addComment({
        name: projectUpdate.name,
        comment: content,
      });

      if (result?.message) {
        setProjectUpdate(result.message);
        const convertedComments = result.message.comments.map((comment: ProjectComment) =>
          convertProjectCommentToComment(comment, user.user)
        );
        setComments(convertedComments);
        refetchProjectUpdate();
      }
    } catch (error) {
      const err = parseFrappeErrorMsg(error as FrappeError);
      toast({
        description: err,
        variant: "destructive",
      });
      console.error("Error submitting comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentUpdate = async (commentId: string, newContent: string) => {
    if (!projectUpdate) return;

    try {
      const comment = projectUpdate.comments.find((c) => c.name === commentId);
      if (!comment) return;

      const result = await updateComment({
        name: projectUpdate.name,
        comment_name: comment.name,
        comment: newContent,
      });

      if (result?.message) {
        setProjectUpdate(result.message);
        const convertedComments = result.message.comments.map((comment: ProjectComment) =>
          convertProjectCommentToComment(comment, user.user)
        );
        setComments(convertedComments);
        refetchProjectUpdate();
      }
    } catch (error) {
      const err = parseFrappeErrorMsg(error as FrappeError);
      toast({
        description: err,
        variant: "destructive",
      });
      console.error("Error updating comment:", err);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!projectUpdate) return;

    try {
      const comment = projectUpdate.comments.find((c) => c.name === commentId);
      if (!comment) return;

      const result = await deleteComment({
        name: projectUpdate.name,
        comment_name: comment.name,
      });

      if (result?.message) {
        setProjectUpdate(result.message);
        const convertedComments = result.message.comments.map((comment: ProjectComment) =>
          convertProjectCommentToComment(comment, user.user)
        );
        setComments(convertedComments);
        toast({
          description: "Comment deleted successfully",
          variant: "success",
        });
        refetchProjectUpdate();
      }
    } catch (error) {
      const err = parseFrappeErrorMsg(error as FrappeError);
      toast({
        description: err,
        variant: "destructive",
      });
      console.error("Error deleting comment:", err);
    }
  };

  const handleShareComment = (commentId: string) => {
    copyToClipboard(`${window.location.origin}/next-pms/project/${projectId}?tab=Project Updates&cid=${commentId}`);
  };

  const handleFetchUsers = async (searchTerm: string): Promise<User[]> => {
    try {
      const filters = [
        ["enabled", "=", 1],
        ["user_type", "=", "System User"],
      ];
      if (searchTerm && searchTerm.trim()) {
        filters.push(["full_name", "like", `%${searchTerm}%`]);
      }
      const result = await fetchUsersAPI({
        doctype: "User",
        fields: ["name", "full_name", "user_image"],
        filters: filters,
        limit_page_length: 10,
        order_by: "full_name asc",
      });
      if (result?.message && Array.isArray(result.message)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedUsers = result.message.map((user: any) => ({
          id: user.name,
          value: user.full_name || user.name,
        }));
        return mappedUsers;
      }
    } catch (error) {
      const err = parseFrappeErrorMsg(error as FrappeError);
      toast({
        description: err,
        variant: "destructive",
      });
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className={mergeClassNames("w-full", className)}>
        <div className="w-full bg-background p-8 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 w-3/4 max-md:w-full mb-4">
              <Skeleton className="h-8 w-8 bg-gray-200 rounded-full"></Skeleton>
              <Skeleton className="h-8 bg-gray-200 w-full rounded"></Skeleton>
            </div>
            <Skeleton className="h-4 bg-gray-200 rounded w-1/2 mb-8"></Skeleton>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 bg-gray-200 rounded"></Skeleton>
            <Skeleton className="h-6 bg-gray-200 rounded w-5/6"></Skeleton>
            <Skeleton className="h-6 bg-gray-200 rounded w-4/6"></Skeleton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={mergeClassNames("w-full", className)}>
      <div className="w-full">
        {projectUpdate && (
          <div className="px-8 max-md:px-3 py-6 pb-3 border-b border-foreground/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-10 max-md:size-8">
                  <AvatarImage src={projectUpdate?.owner_image} alt={projectUpdate?.owner_full_name} />
                  <AvatarFallback className="text-foreground font-semibold">
                    {getInitials(projectUpdate?.owner_full_name || "")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col max-md:max-w-[10rem]">
                  <Typography
                    title={projectUpdate?.owner_full_name}
                    variant="p"
                    className="font-semibold text-foreground truncate"
                  >
                    {projectUpdate?.owner_full_name}
                  </Typography>
                  <Typography
                    title={projectUpdate?.owner}
                    variant="small"
                    className="text-muted-foreground text-wrap truncate"
                  >
                    {projectUpdate?.owner}
                  </Typography>
                </div>
              </div>
              <Badge variant={projectUpdate?.status === "Publish" ? "default" : "outline"}>
                {projectUpdate?.status}
              </Badge>
            </div>
          </div>
        )}
        <div className="px-8 max-md:px-3 pt-6">
          <div className="group">
            {editingTitle ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-4xl max-md:text-xl font-bold border-0 border-b-2 focus-visible:border-foreground rounded-none px-0 bg-transparent focus:ring-0 focus-visible:ring-0 shadow-none md:text-3xl"
                placeholder="Enter project title..."
                autoFocus
              />
            ) : (
              <div className="flex items-center group cursor-pointer" onClick={handleEditTitle}>
                <Typography variant="h1" className="text-4xl max-md:text-2xl font-bold text-foreground flex-1 py-2">
                  {projectUpdate?.title || "Add Title"}
                </Typography>
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-4"
                  disabled={isSaving}
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          {editingDescription ? (
            <div className="w-full">
              <div className="bg-background mx-8 max-md:mx-3 max-md:mx-3 mt-3 rounded-lg border  overflow-hidden focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
                <TextEditor
                  value={editDescription}
                  onChange={setEditDescription}
                  placeholder="Start writing your project update..."
                  className="min-h-[30rem] border-0"
                />
              </div>
            </div>
          ) : (
            <div className="group cursor-pointer" onClick={handleEditDescription}>
              <div className="bg-background mx-8 max-md:mx-3  pb-2 overflow-hidden transition-colors duration-200 flex flex-col items-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-fit opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  disabled={isSaving}
                >
                  <Edit3 className="h-5 w-5" />
                </Button>
                <div className="w-full">
                  <TextEditor
                    value={projectUpdate?.description}
                    onChange={() => {}}
                    placeholder="Start writing your project update..."
                    hideToolbar={true}
                    className="min-h-[400px] max-h-fit border-0 [&_.ql-editor]:cursor-pointer [&_.ql-editor]:bg-transparent [&_.ql-editor]:px-0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={mergeClassNames(
            "mx-8 max-md:mx-3  mt-6 border-t border-foreground/10 pt-6",
            !projectUpdate?.name && "border-t-0"
          )}
        >
          <div className="flex items-center justify-between max-lg:flex-col max-md:gap-4 w-full max-lg:gap-3 max-lg:items-start">
            {projectUpdate && (
              <div className="flex items-center truncate max-md:w-full  max-md:flex-col gap-3 text-sm text-gray-500">
                <div className="flex gap-1 w-full">
                  <Calendar className="h-4 w-4 text-foreground/70" />
                  <Typography variant="p" className="text-foreground/70 max-md:text-xs">
                    Created {formatDate(projectUpdate?.creation)}
                  </Typography>
                </div>
                {projectUpdate?.last_edited_at && (
                  <div className="flex gap-1 w-full">
                    <Edit3 className="h-4 w-4 text-foreground/70" />
                    <Typography variant="p" className="text-foreground/70 max-md:text-xs">
                      Last edited {formatDate(projectUpdate?.last_edited_at)}
                    </Typography>
                  </div>
                )}
              </div>
            )}

            {(editingDescription || editingTitle) && (
              <div className="flex items-center gap-3 max-lg:w-full max-lg:justify-between">
                <Button
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => {
                    if (editingTitle) {
                      handleCancelTitle();
                    }
                    if (editingDescription) {
                      handleCancelDescription();
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                {projectUpdate?.status === "Publish" ? (
                  <Button
                    className=" px-6"
                    disabled={isSaving || (editingTitle ? !editTitle.trim() : !editDescription.trim())}
                    onClick={() => handleSave("Publish")}
                  >
                    <Save className="mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                ) : (
                  <DropdownMenu open={isOpenSaveChanges} onOpenChange={setIsOpenSaveChanges}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className=" px-6"
                        disabled={isSaving || (editingTitle ? !editTitle.trim() : !editDescription.trim())}
                      >
                        <Save className="mr-2" />
                        {isSaving ? "Saving..." : "Save"}
                        {isOpenSaveChanges ? (
                          <ChevronUp className="ml-5 h-4 w-4" />
                        ) : (
                          <ChevronDown className="ml-5 h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleSave("Draft")}
                        className="cursor-pointer"
                        disabled={isSaving}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Save as Draft</span>
                          <span className="text-xs text-muted-foreground">Save without publishing</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSave("Review")}
                        className="cursor-pointer"
                        disabled={isSaving}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Review</span>
                          <span className="text-xs text-muted-foreground">Submit for review</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSave("Publish")}
                        className="cursor-pointer"
                        disabled={isSaving}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">Publish Now</span>
                          <span className="text-xs text-muted-foreground">Make public immediately</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>

        {projectUpdate?.name && (
          <div className="mx-8 max-md:mx-3 mb-4">
            <Comments
              comments={comments}
              activeCommentName={searchParams.get("cid") ?? ""}
              onSubmit={handleCommentSubmit}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentDelete}
              onShare={handleShareComment}
              isSubmitting={isSubmittingComment || isAddingComment || isUpdatingComment || isDeletingComment}
              title="Comments"
              placeholder="Share your thoughts on this project update..."
              className="mt-8"
              enableMentions={true}
              onFetchUsers={handleFetchUsers}
              mentionClassName="bg-blue-50 text-xs dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-semibold border border-blue-500 whitespace-nowrap inline-block hover:bg-blue-100 dark:hover:bg-blue-900"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectUpdates;
