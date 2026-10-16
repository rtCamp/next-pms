import type { ApprovalStatusValue } from "@/components/ApprovalStatus";

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
