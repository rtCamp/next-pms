import { TaskState } from "@/store/task";


export const createFilter = (taskState: TaskState) => {
  return {
    search: taskState.search,
    projects: taskState.selectedProject,
    status: taskState.selectedStatus,
    groupBy: taskState.groupBy,
  };
};

export const getFilter = (taskState: TaskState) => {
  const filters = [];

  if (taskState.search) {
    filters.push(["search", "like", `%${taskState.search}%`]);
  }

  if (taskState.selectedProject.length > 0) {
    filters.push(["project_name", "in", taskState.selectedProject]);
  }

  if (taskState.selectedStatus.length > 0) {
    filters.push(["status", "in", taskState.selectedStatus]);
  }

  if (taskState.groupBy.length > 0) {
    filters.push(["groupBy", "in", taskState.groupBy]);
  }

  return filters;
};

export const status = [
  { value: "Open", label: "Open" },
  { value: "Working", label: "Working" },
  { value: "Pending Review", label: "Pending Review" },
  { value: "Overdue", label: "Overdue" },
  { value: "Template", label: "Template" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];