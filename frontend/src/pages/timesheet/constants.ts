import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type { FilterField } from "@/components/Filter";
import { DATE_FILTER_FIELD } from "./filters";

/** Weeks per request on the personal page. */
export const PERSONAL_WEEKS_PER_PAGE = 4;
/** Weeks per request on the team page. */
export const TEAM_WEEKS_PER_PAGE = 12;
/** Weeks per request on the project page. */
export const PROJECT_WEEKS_PER_PAGE = 12;

/** Statuses the approval-status filter offers, in React's order. */
export const APPROVAL_FILTER_STATUSES: ApprovalStatusValue[] = [
  "Not Submitted",
  "Approved",
  "Rejected",
  "Approval Pending",
  "Partially Approved",
  "Partially Rejected",
];

export type TimesheetView = "personal" | "team" | "project";

/** The three timesheet views in the breadcrumb's view menu. */
export const TIMESHEET_VIEWS: {
  key: TimesheetView;
  label: string;
  routeName: string;
  icon: string;
}[] = [
  {
    key: "personal",
    label: "Personal",
    routeName: "timesheet-personal",
    icon: "lucide-clock",
  },
  {
    key: "team",
    label: "Team",
    routeName: "timesheet-team",
    icon: "lucide-users",
  },
  {
    key: "project",
    label: "Project",
    routeName: "timesheet-project",
    icon: "lucide-folder",
  },
];

/** localStorage key of the liked tasks imported per week, as the React app wrote it. */
export const IMPORTED_TASKS_STORAGE_KEY = "next-pms:importedTasks";

/** Weeks expanded on load when the user has no setting. */
export const DEFAULT_AUTO_EXPAND_WEEKS = 4;

/** Hours a day the time-entry form allows when the employee's are unknown. */
export const FALLBACK_DAILY_WORKING_HOURS = 8;

const EQUALITY_OPERATORS = [
  { label: "Equals", value: "=" },
  { label: "Not Equals", value: "!=" },
];

/** Fields of the personal page's Filter. */
export const PERSONAL_TIMESHEET_FILTER_FIELDS: FilterField[] = [
  {
    fieldCategory: "Timesheet Detail",
    name: "project",
    label: "Project",
    type: "link",
    link: { doctype: "Project", labelField: "project_name" },
    operators: EQUALITY_OPERATORS,
  },
  {
    fieldCategory: "Timesheet Detail",
    name: "task",
    label: "Task",
    type: "link",
    link: { doctype: "Task", labelField: "subject" },
    operators: EQUALITY_OPERATORS,
  },
  { name: DATE_FILTER_FIELD, label: "Date", type: "daterange" },
];

/** Leave durations of the time-off dialog, as React kept them. */
export const LEAVE_DURATIONS = [
  "full-day",
  "first-half",
  "second-half",
] as const;
