import type { ApprovalStatusValue } from "@/components/ApprovalStatus";
import type { FilterField } from "@/components/Filter";
import { DATE_FILTER_FIELD } from "./filters";

/** Weeks per request on the personal page. */
export const PERSONAL_WEEKS_PER_PAGE = 4;
/** Weeks per request on the team page. */
export const TEAM_WEEKS_PER_PAGE = 12;
/** Members per request in a team week. */
export const TEAM_MEMBER_PAGE_LENGTH = 20;
/** Weeks per request on the project page. */
export const PROJECT_WEEKS_PER_PAGE = 12;
/** Projects per request in a project week. */
export const PROJECT_PAGE_LENGTH = 4;

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

const PROJECT_FILTER_FIELD: FilterField = {
  fieldCategory: "Timesheet Detail",
  name: "project",
  label: "Project",
  type: "link",
  link: { doctype: "Project", labelField: "project_name" },
  operators: EQUALITY_OPERATORS,
};

const DATE_RANGE_FILTER_FIELD: FilterField = {
  name: DATE_FILTER_FIELD,
  label: "Date",
  type: "daterange",
};

const MEMBER_FILTER_FIELD: FilterField = {
  fieldCategory: "Timesheet",
  name: "employee",
  label: "Member",
  type: "link",
  link: {
    doctype: "Employee",
    labelField: "employee_name",
    customMethod: {
      method: "next_pms.timesheet.api.employee.get_employee_list",
    },
  },
  operators: EQUALITY_OPERATORS,
};

/** Fields of the personal page's Filter. */
export const PERSONAL_TIMESHEET_FILTER_FIELDS: FilterField[] = [
  PROJECT_FILTER_FIELD,
  {
    fieldCategory: "Timesheet Detail",
    name: "task",
    label: "Task",
    type: "link",
    link: { doctype: "Task", labelField: "subject" },
    operators: EQUALITY_OPERATORS,
  },
  DATE_RANGE_FILTER_FIELD,
];

/** Fields of the team page's Filter. */
export const TEAM_TIMESHEET_FILTER_FIELDS: FilterField[] = [
  ...PERSONAL_TIMESHEET_FILTER_FIELDS,
  MEMBER_FILTER_FIELD,
  {
    fieldCategory: "Employee",
    name: "status",
    label: "Member Status",
    type: "select",
    options: [
      { label: "Active", value: "Active" },
      { label: "Inactive", value: "Inactive" },
      { label: "Suspended", value: "Suspended" },
      { label: "Left", value: "Left" },
    ],
    // Status is mandatory, so the default empty checks mean nothing here.
    operators: [
      { label: "is", value: "=" },
      { label: "is not", value: "!=" },
    ],
  },
  {
    fieldCategory: "Employee",
    name: "custom_business_unit",
    label: "Business Unit",
    type: "link",
    link: { doctype: "Business Unit" },
    operators: EQUALITY_OPERATORS,
  },
];

/** Leave durations of the time-off dialog, as React kept them. */
export const LEAVE_DURATIONS = [
  "full-day",
  "first-half",
  "second-half",
] as const;

/** Fields of the project page's Filter. */
export const PROJECT_TIMESHEET_FILTER_FIELDS: FilterField[] = [
  PROJECT_FILTER_FIELD,
  DATE_RANGE_FILTER_FIELD,
  MEMBER_FILTER_FIELD,
];
