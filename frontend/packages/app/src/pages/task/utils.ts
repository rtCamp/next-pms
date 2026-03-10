/**
 * Internal dependencies.
 */
import type { TaskState } from "./types";

export const createFilter = (taskState: TaskState) => {
  return {
    search: taskState.search ?? "",
    projects: taskState.selectedProject,
    status: taskState.selectedStatus,
  };
};

export const getFilter = (taskState: TaskState) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filters: Record<string, any> = {};

  if (taskState.search) {
    filters["subject"] = ["LIKE", `%${taskState.search}%`];
  }

  if (taskState.selectedProject.length > 0) {
    filters["project"] = ["in", taskState.selectedProject];
  }

  if (taskState.selectedStatus.length > 0) {
    filters["status"] = ["in", taskState.selectedStatus];
  }

  return filters;
};
