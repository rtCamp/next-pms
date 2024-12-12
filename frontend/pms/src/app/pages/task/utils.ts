import { TaskState } from "@/store/task";

export const defaultRows: string[] = [
  "project_name",
  "subject",
  "status",
  "priority",
  "exp_end_date",
  "expected_time",
  "actual_time",
];

export const defaultView = () => {
  const columns = Object.fromEntries(defaultRows.map((value) => [value, 150]));
  const view = {
    label: "Task",
    user: "",
    type: "List",
    dt: "Task",
    route: "task",
    rows: defaultRows,
    columns: columns,
    filters: { search: "", projects: [], status: [], groupBy: [] },
    default: true,
    public: false,
    order_by: {
      field: "project_name",
      order: "desc",
    },
  };
  return view;
};
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
