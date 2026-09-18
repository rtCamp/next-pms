export const ROUTES = {
  base: "/next-pms",
  dashboard: "/dashboard",
  "dashboard-leadership": "/dashboard/leadership",
  "dashboard-manager": "/dashboard/manager",
  project: "/projects",
  task: "/tasks",
  "timesheet-personal": "/timesheet",
  "timesheet-team": "/timesheet/team",
  "timesheet-project": "/timesheet/project",
  "allocations-team": "/allocations/team",
  "allocations-project": "/allocations/project",
  desk: "/desk",
  apps: "/apps",
  "not-found": "/not-found",
  "no-employee": "/no-employee",
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

/** Fallback number of weeks expanded by default when no user/system value is set. */
export const DEFAULT_AUTO_EXPAND_WEEKS = 4;

/** Default daily working hours used when an employee's configured hours are unavailable. */
export const FALLBACK_DAILY_WORKING_HOURS = 8;

/** Operators that carry no value. */
export const NO_VALUE_OPERATORS: string[] = ["is_empty", "is_not_empty"];
