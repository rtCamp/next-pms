/**
 * External dependencies.
 */
import { type Comment } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { ProjectState } from "@/store/project";
import { ProjectComment } from "./types";

export const createFilter = (projectState: ProjectState) => {
  return {
    search: projectState.search,
    project_type: projectState.selectedProjectType,
    status: projectState.selectedStatus,
    business_unit: projectState.selectedBusinessUnit,
    currency: projectState.currency,
    billing_type: projectState.selectedBillingType,
    tag: projectState.tag,
    industry: projectState.selectedIndustry,
  };
};

export const getFilter = (projectState: ProjectState) => {
  const filters = [];

  if (projectState.search) {
    filters.push(["project_name", "like", `%${projectState.search}%`]);
  }
  if (projectState.selectedProjectType.length > 0) {
    filters.push(["project_type", "in", projectState.selectedProjectType]);
  }
  if (projectState.selectedStatus.length > 0) {
    filters.push(["status", "in", projectState.selectedStatus]);
  }
  if (projectState.selectedBusinessUnit.length > 0) {
    filters.push([
      "custom_business_unit",
      "in",
      projectState.selectedBusinessUnit,
    ]);
  }
  if (projectState.selectedBillingType.length > 0) {
    filters.push([
      "custom_billing_type",
      "in",
      projectState.selectedBillingType,
    ]);
  }
  if (projectState.selectedIndustry.length > 0) {
    filters.push(["custom_industry", "in", projectState.selectedIndustry]);
  }
  if (projectState.tag.length > 0) {
    projectState.tag.forEach((tag) => {
      filters.push(["Project", "_user_tags", "like", `%${tag}%`]);
    });
  }
  return filters;
};

export const getValidUserTagsValues = (input: string) => {
  if (!input) return []; // Handle null, undefined, or empty input
  return input
    .split(",") // Split by comma
    .map((value) => value.trim()) // Trim whitespace around values
    .filter((value) => value !== "" && value !== "null"); // Exclude empty and 'null' values
};

export const convertProjectCommentToComment = (
  projectComment: ProjectComment,
  currentUser?: string
): Comment => {
  return {
    name: projectComment.name,
    userImageUrl: projectComment.user_image || "",
    userName: projectComment.user_full_name,
    content: projectComment.comment,
    createdAt: projectComment.created_at,
    updatedAt:
      projectComment.modified_at !== projectComment.created_at
        ? projectComment.modified_at
        : undefined,
    canEdit: projectComment.user === currentUser,
    canDelete: projectComment.user === currentUser,
    owner: projectComment.owner,
  };
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};
