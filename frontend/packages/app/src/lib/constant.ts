export const ROUTES = {
  base: "/next-pms",
  dashboard: "/dashboard",
  "dashboard-leadership": "/dashboard/leadership",
  "dashboard-manager": "/dashboard/manager",
  project: "/projects",
  "project-kanban": "/projects/kanban",
  "timesheet-personal": "/timesheet",
  "timesheet-team": "/timesheet/team",
  "timesheet-project": "/timesheet/project",
  "allocations-team": "/allocations/team",
  "allocations-project": "/allocations/project",
  desk: "/desk",
  apps: "/apps",
  "not-found": "/not-found",
};
export const IMPORTED_TASKS_STORAGE_KEY = "next-pms:importedTasks";

export const CustomTime = [
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
];

export const NUMBER_OF_WEEKS_TO_FETCH = 4;

/** Operators that carry no value. */
export const NO_VALUE_OPERATORS: string[] = ["is_empty", "is_not_empty"];
