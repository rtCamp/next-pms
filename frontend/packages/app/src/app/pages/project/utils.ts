/**
 * Internal dependencies.
 */
import { ProjectState } from "@/store/project";

export const createFilter = (projectState: ProjectState) => {
  return {
    search: projectState.search,
    project_type: projectState.selectedProjectType,
    status: projectState.selectedStatus,
    business_unit: projectState.selectedBusinessUnit,
    currency: projectState.currency,
    billing_type: projectState.selectedBillingType,
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
  if (projectState.tag.length > 0) {
    filters.push(["_user_tags", "like", `%${projectState.tag[0]}%`]);
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
