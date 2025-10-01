/**
 * External dependencies
 */
import { useState, useEffect } from "react";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Skeleton,
	useToast,
	Badge,
	Spinner,
} from "@next-pms/design-system/components";
import type { User } from "@next-pms/design-system/components";
import {
	FrappeError,
	useFrappeGetCall,
	useFrappePostCall,
} from "frappe-react-sdk";
import {
	Calendar,
	Edit3,
	X,
	ChevronDown,
	ChevronUp,
	Save,
	Forward,
	MoreHorizontal,
} from "lucide-react";

/**
 * Internal dependencies
 */
import { mergeClassNames, parseFrappeErrorMsg } from "@/lib/utils";
import { copyToClipboard } from "@/lib/utils";
import { RootState, useAppSelector } from "@/store";
import { ProjectComment, ProjectUpdate } from "../../types";
import { convertProjectCommentToComment, getInitials } from "../../utils";

interface ProjectUpdatesProps {
	projectId?: string;
	className?: string;
}

const ProjectUpdates = ({ projectId, className }: ProjectUpdatesProps) => {
	const { toast } = useToast();
	const user = useAppSelector((state) => state.user);
	const [searchParams] = useSearchParams();
	const puid = searchParams.get("puid");

	const [isOpenSaveChanges, setIsOpenSaveChanges] = useState(false);
	const [projectUpdates, setProjectUpdates] = useState<ProjectUpdate[]>([]);
	const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [editData, setEditData] = useState({
		title: "",
		description: "",
	});
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
		},
	);

	const { call: saveProjectUpdate, loading: isSaving } = useFrappePostCall(
		"next_pms.timesheet.api.project_status_update.save_project_status_update",
	);

	const { call: addComment, loading: isAddingComment } = useFrappePostCall(
		"next_pms.timesheet.api.project_status_update.add_comment_to_project_status_update",
	);

	const { call: updateComment, loading: isUpdatingComment } = useFrappePostCall(
		"next_pms.timesheet.api.project_status_update.update_comment_in_project_status_update",
	);

	const { call: deleteComment, loading: isDeletingComment } = useFrappePostCall(
		"next_pms.timesheet.api.project_status_update.delete_comment_from_project_status_update",
	);

	const { call: fetchUsersAPI } = useFrappePostCall("frappe.client.get_list");

	useEffect(() => {
		if (projectUpdatesData?.message && projectUpdatesData.message.length > 0) {
			setProjectUpdates(projectUpdatesData.message);
		} else if (projectUpdatesData?.message && projectId) {
			setProjectUpdates([]);
		}
	}, [projectUpdatesData, projectId]);

	const handleSave = async (status?: string) => {
		if (!projectId) return;

		const titleToSave = editData.title.trim();
		const descriptionToSave = editData.description.trim();
		const statusToSave = status || "Draft";

		if (!titleToSave) {
			toast({
				description: "Project Update title is required",
				variant: "destructive",
			});
			return;
		}

		try {
			const finalStatus =
				editingUpdateId && currentUpdate?.status === "Publish"
					? currentUpdate.status
					: statusToSave;

			const result = await saveProjectUpdate({
				project: projectId,
				title: titleToSave,
				description: descriptionToSave || "",
				status: finalStatus,
				...(editingUpdateId && { name: editingUpdateId }),
			});

			if (result?.message) {
				if (isCreatingNew) {
					setProjectUpdates((prev) => [result.message, ...prev]);
					setIsCreatingNew(false);
				} else if (editingUpdateId) {
					setProjectUpdates((prev) =>
						prev.map((update) =>
							update.name === editingUpdateId ? result.message : update,
						),
					);
					setEditingUpdateId(null);
				}

				setEditData({ title: "", description: "" });

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

	const handleCancel = () => {
		setEditData({ title: "", description: "" });
		setEditingUpdateId(null);
		setIsCreatingNew(false);
	};

	const handleEditUpdate = (update: ProjectUpdate) => {
		setEditData({
			title: update.title,
			description: update.description,
		});
		setEditingUpdateId(update.name);
		setIsCreatingNew(false);
	};

	const handleCreateNew = () => {
		setEditData({ title: "", description: "" });
		setEditingUpdateId(null);
		setIsCreatingNew(true);
	};

	const handleCommentSubmit = async (
		content: string,
		projectUpdateId?: string,
	): Promise<void> => {
		// Use the provided projectUpdateId or find the current update being viewed
		const currentUpdate = projectUpdateId
			? projectUpdates.find((update) => update.name === projectUpdateId)
			: projectUpdates.find((update) => update.name === editingUpdateId) ||
				projectUpdates[0];
		if (!currentUpdate) return;

		setIsSubmittingComment(true);

		try {
			const result = await addComment({
				name: currentUpdate.name,
				comment: content,
			});

			if (result?.message) {
				setProjectUpdates((prev) =>
					prev.map((update) =>
						update.name === currentUpdate.name ? result.message : update,
					),
				);
				refetchProjectUpdate();
			}
		} catch (error) {
			const err = parseFrappeErrorMsg(error as FrappeError);
			toast({
				description: err,
				variant: "destructive",
			});
		} finally {
			setIsSubmittingComment(false);
		}
	};

	const handleCommentUpdate = async (
		commentId: string,
		newContent: string,
		projectUpdateId?: string,
	) => {
		const currentUpdate = projectUpdateId
			? projectUpdates.find((update) => update.name === projectUpdateId)
			: projectUpdates.find((update) => update.name === editingUpdateId) ||
				projectUpdates[0];
		if (!currentUpdate) return;

		try {
			const comment = currentUpdate.comments.find((c) => c.name === commentId);
			if (!comment) return;

			const result = await updateComment({
				name: currentUpdate.name,
				comment_name: comment.name,
				comment: newContent,
			});

			if (result?.message) {
				setProjectUpdates((prev) =>
					prev.map((update) =>
						update.name === currentUpdate.name ? result.message : update,
					),
				);
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

	const handleCommentDelete = async (
		commentId: string,
		projectUpdateId?: string,
	) => {
		const currentUpdate = projectUpdateId
			? projectUpdates.find((update) => update.name === projectUpdateId)
			: projectUpdates.find((update) => update.name === editingUpdateId) ||
				projectUpdates[0];
		if (!currentUpdate) return;

		try {
			const comment = currentUpdate.comments.find((c) => c.name === commentId);
			if (!comment) return;

			const result = await deleteComment({
				name: currentUpdate.name,
				comment_name: comment.name,
			});

			if (result?.message) {
				setProjectUpdates((prev) =>
					prev.map((update) =>
						update.name === currentUpdate.name ? result.message : update,
					),
				);
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
		}
	};

	const handleShareComment = (commentId: string) => {
		copyToClipboard(
			`${window.location.origin}/next-pms/project/${projectId}?tab=Project Updates&cid=${commentId}`,
		);
	};

	const handleShareProjectUpdate = (projectUpdateId: string) => {
		copyToClipboard(
			`${window.location.origin}/next-pms/project/${projectId}?tab=Project Updates&puid=${projectUpdateId}`,
		);
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

	useEffect(() => {
		if (puid && projectUpdates.length > 0) {
			const element = document.getElementById(puid);
			if (element) {
				element.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}
		}
	}, [puid, projectUpdates]);

	if (isLoading) {
		return (
			<div className={mergeClassNames("w-full", className)}>
				<div className="w-full bg-background p-8 flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<div className="flex gap-2 w-3/4 max-md:w-full mb-4">
							<Skeleton className="h-8 w-8 rounded-full"></Skeleton>
							<Skeleton className="h-8 w-full rounded"></Skeleton>
						</div>
						<Skeleton className="h-4 rounded w-1/2 mb-8"></Skeleton>
					</div>
					<div className="space-y-3">
						<Skeleton className="h-6 rounded"></Skeleton>
						<Skeleton className="h-6 rounded w-5/6"></Skeleton>
						<Skeleton className="h-6 rounded w-4/6"></Skeleton>
					</div>
				</div>
			</div>
		);
	}

	const currentUpdate =
		projectUpdates.find((update) => update.name === editingUpdateId) ||
		projectUpdates[0];
	const isEditing = editingUpdateId !== null || isCreatingNew;

	return (
		<div className={mergeClassNames("w-full", className)}>
			<div className="w-full">
				{projectUpdates.length > 0 && !isEditing && (
					<div className="px-5 max-md:px-3 py-4 border-b">
						<Button
							onClick={handleCreateNew}
							className="w-full"
							variant="outline"
						>
							<Edit3 className="mr-2" />
							Add New Project Update
						</Button>
					</div>
				)}

				{isEditing && (
					<>
						<div className="px-8 max-md:px-3 pt-6">
							<div className="group">
								<Input
									value={editData.title}
									onChange={(e) =>
										setEditData((prev) => ({ ...prev, title: e.target.value }))
									}
									className="text-4xl max-md:text-xl font-bold border-0 border-b-2 focus-visible:border-foreground rounded-none px-0 bg-transparent focus:ring-0 focus-visible:ring-0 shadow-none md:text-3xl"
									placeholder="Enter project title..."
									autoFocus
								/>
							</div>
						</div>

						<div className="w-full">
							<div className="bg-background mx-8 max-md:mx-3 mt-3 rounded-lg border overflow-hidden focus-within:border-foreground focus-within:ring-1 focus-within:ring-foreground">
								<TextEditor
									value={editData.description}
									onChange={(value) =>
										setEditData((prev) => ({ ...prev, description: value }))
									}
									placeholder="Start writing your project update..."
									className="min-h-[30rem] border-0"
								/>
							</div>
						</div>

						<div className="mx-8 max-md:mx-3 mt-6 border-t border-foreground/10 pt-6 max-md:mb-6">
							<div className="flex items-center justify-end gap-3">
								<Button
									variant="outline"
									disabled={isSaving}
									onClick={handleCancel}
								>
									<X className="mr-2" />
									Cancel
								</Button>
								{editingUpdateId && currentUpdate?.status === "Publish" ? (
									<Button
										className="px-6"
										disabled={isSaving || !editData.title.trim()}
										onClick={() => handleSave("Publish")}
									>
										{isSaving ? (
											<Spinner className="mr-2 size-4" />
										) : (
											<Save className="mr-2" />
										)}
										Save
									</Button>
								) : (
									<DropdownMenu
										open={isOpenSaveChanges}
										onOpenChange={setIsOpenSaveChanges}
									>
										<DropdownMenuTrigger asChild>
											<Button
												className="px-6"
												disabled={isSaving || !editData.title.trim()}
											>
												{isSaving ? (
													<Spinner className="mr-2 size-4" />
												) : (
													<Save className="mr-2" />
												)}
												Save
												{isOpenSaveChanges ? (
													<ChevronUp className="ml-5" />
												) : (
													<ChevronDown className="ml-5" />
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
													<span className="text-xs text-muted-foreground">
														Save without publishing
													</span>
												</div>
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleSave("Publish")}
												className="cursor-pointer"
												disabled={isSaving}
											>
												<div className="flex flex-col">
													<span className="font-medium">Publish Now</span>
													<span className="text-xs text-muted-foreground">
														Make public immediately
													</span>
												</div>
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								)}
							</div>
						</div>
					</>
				)}

				{!isEditing && projectUpdates.length > 0 && (
					<div className="space-y-6">
						{projectUpdates.map((update) => (
							<div
								id={update.name}
								key={update.name}
								className="border-b border-foreground/10 last:border-b-0 rounded-lg"
							>
								<div className="px-8 max-md:px-3 py-6 pb-3">
									<div className="flex items-center gap-2 justify-between mb-6">
										<div className="flex items-center gap-4">
											<Avatar className="size-10 max-md:size-8 shrink-0">
												<AvatarImage
													src={update.owner_image}
													alt={update.owner_full_name}
												/>
												<AvatarFallback className="text-foreground font-semibold">
													{getInitials(update.owner_full_name || "")}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col max-md:max-w-[7rem]">
												<Typography
													title={update.owner_full_name}
													variant="p"
													className="font-semibold text-foreground truncate"
												>
													{update.owner_full_name}
												</Typography>
												<Typography
													title={update.owner}
													variant="small"
													className="text-muted-foreground text-wrap truncate"
												>
													{update.owner}
												</Typography>
											</div>
										</div>
										<div className="flex items-center gap-3 max-md:gap-1 shrink-0">
											<Badge
												variant={
													update.status === "Publish" ? "default" : "outline"
												}
											>
												{update.status}
											</Badge>
											<div className="hidden md:flex items-center gap-1">
												<Button
													variant="ghost"
													size="sm"
													className="h-auto p-2"
													onClick={() => handleEditUpdate(update)}
													disabled={isSaving}
												>
													<Edit3 />
												</Button>
												<Button
													title="Share"
													onClick={() => handleShareProjectUpdate(update.name)}
													variant="ghost"
													size="sm"
													className="h-auto p-2"
												>
													<Forward className="scale-x-[-1]" />
													<span className="sr-only">Share</span>
												</Button>
											</div>

											<div className="md:hidden">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															className="h-auto p-2"
															disabled={isSaving}
														>
															<MoreHorizontal />
															<span className="sr-only">More options</span>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem
															onClick={() => handleEditUpdate(update)}
															className="cursor-pointer"
															disabled={isSaving}
														>
															<Edit3 className="mr-2" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																handleShareProjectUpdate(update.name)
															}
															className="cursor-pointer"
														>
															<Forward className="mr-2 scale-x-[-1]" />
															Share
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										</div>
									</div>
								</div>

								<div className="px-8 max-md:px-3 pb-6">
									<Typography
										variant="h2"
										className="text-2xl max-md:text-xl font-bold text-foreground mb-4"
									>
										{update.title}
									</Typography>
									<div className="prose max-w-none">
										<TextEditor
											value={update.description}
											onChange={() => {}}
											placeholder="No description provided..."
											hideToolbar={true}
											readOnly={true}
											className="min-h-[200px] max-h-fit border-0 [&_.ql-editor]:cursor-default [&_.ql-editor]:bg-transparent [&_.ql-editor]:px-0 [&_.ql-editor]:pointer-events-none"
										/>
									</div>
								</div>

								<div className="px-8 max-md:px-3 pb-6">
									<div className="flex items-center gap-6 text-sm text-gray-500">
										<div className="flex gap-1">
											<Calendar className="text-foreground/70" />
											<Typography
												variant="p"
												className="text-foreground/70 max-md:text-xs"
											>
												Created {formatDate(update.creation)}
											</Typography>
										</div>
										{update.last_edited_at && (
											<div className="flex gap-1">
												<Edit3 className="text-foreground/70" />
												<Typography
													variant="p"
													className="text-foreground/70 max-md:text-xs"
												>
													Last edited {formatDate(update.last_edited_at)}
												</Typography>
											</div>
										)}
									</div>
								</div>

								<div className="px-8 max-md:px-3 pb-6">
									<Comments
										comments={update.comments.map((comment: ProjectComment) =>
											convertProjectCommentToComment(comment, user.user),
										)}
										activeCommentName={searchParams.get("cid") ?? ""}
										onSubmit={(content) =>
											handleCommentSubmit(content, update.name)
										}
										onUpdate={(commentId, newContent) =>
											handleCommentUpdate(commentId, newContent, update.name)
										}
										onDelete={(commentId) =>
											handleCommentDelete(commentId, update.name)
										}
										onShare={handleShareComment}
										isSubmitting={
											isSubmittingComment ||
											isAddingComment ||
											isUpdatingComment ||
											isDeletingComment
										}
										title="Comments"
										emptyMessage="No comments for this project update"
										placeholder="Share your thoughts on this project update..."
										className="mt-4"
										enableMentions={true}
										onFetchUsers={handleFetchUsers}
										mentionClassName="bg-blue-50 text-xs dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-semibold border border-blue-500 whitespace-nowrap inline-block hover:bg-blue-100 dark:hover:bg-blue-900"
									/>
								</div>
							</div>
						))}
					</div>
				)}

				{!isEditing && projectUpdates.length === 0 && (
					<div className="mt-24 flex justify-center items-center flex-col">
						<Typography
							variant="h3"
							className="text-xl font-semibold text-foreground mb-2"
						>
							No Project Updates Yet
						</Typography>
						<Typography variant="p" className="text-muted-foreground mb-6">
							Create your first project update.
						</Typography>
						<Button onClick={handleCreateNew}>
							<Edit3 className="mr-2" />
							Create First Update
						</Button>
					</div>
				)}
			</div>
		</div>
	);
};

export default ProjectUpdates;
