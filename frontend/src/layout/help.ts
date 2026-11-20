import type { LocationQuery, RouteRecordNameGeneric } from "vue-router";
import type { HelpTip } from "@/components/HelpPanel";
import type { FieldHelp } from "@/components/InfoHoverCard";
import {
  ALLOCATION_DIALOG_TIPS,
  PROJECT_ALLOCATION_TIPS,
  TEAM_ALLOCATION_TIPS,
} from "@/pages/allocations/shared/help";
import {
  LEADERSHIP_DASHBOARD_TIPS,
  MANAGER_DASHBOARD_TIPS,
} from "@/pages/dashboard/help";
import {
  DEFAULT_TAB,
  TAB_PARAM,
  type ProjectTabKey,
} from "@/pages/project-details/constants";
import { PROJECT_DETAIL_TIPS } from "@/pages/project-details/help";
import { PROJECTS_TIPS } from "@/pages/projects/help";
import { TASKS_TIPS } from "@/pages/tasks/help";
import { PERSONAL_TIMESHEET_TIPS } from "@/pages/timesheet/personal/help";
import { PROJECT_TIMESHEET_TIPS } from "@/pages/timesheet/project/help";
import { TEAM_TIMESHEET_TIPS } from "@/pages/timesheet/team/help";
import { queryString } from "@/utils/query";

export const NOTIFICATIONS_HELP = {
  title: "Notifications",
  summary:
    "Alerts you haven't read yet, such as mentions, project updates and timesheets waiting for your review.",
  details: [
    "Read alerts leave the tray, so an empty tray means you're all caught up.",
  ],
  wiki: "Navigation-and-Layout#notifications",
} satisfies FieldHelp;

export const NOTIFICATION_ITEM_TOOLTIP =
  "Marks it read and opens the page it's about.";

/** Each page's tips, by route name. */
const HELP_PAGES: Partial<Record<string, HelpTip[]>> = {
  "timesheet-personal": PERSONAL_TIMESHEET_TIPS,
  "timesheet-team": TEAM_TIMESHEET_TIPS,
  "timesheet-project": PROJECT_TIMESHEET_TIPS,
  "dashboard-manager": MANAGER_DASHBOARD_TIPS,
  "dashboard-leadership": LEADERSHIP_DASHBOARD_TIPS,
  "allocations-team": [...TEAM_ALLOCATION_TIPS, ...ALLOCATION_DIALOG_TIPS],
  "allocations-project": [
    ...PROJECT_ALLOCATION_TIPS,
    ...ALLOCATION_DIALOG_TIPS,
  ],
  project: PROJECTS_TIPS,
  task: TASKS_TIPS,
};

export const GENERAL_TIPS: HelpTip[] = [
  {
    id: "search",
    title: "Jump anywhere with search",
    body: "Press Ctrl+K (Cmd+K on Mac) on any page, type part of a page's name and select it.",
    wiki: "Navigation-and-Layout#global-search",
  },
  {
    id: "app-menu",
    title: "Open Settings and the app menu",
    body: "Select Next PMS at the top of the sidebar. Ctrl+Shift+Comma (Cmd+Shift+Comma on Mac) opens Settings directly.",
    wiki: "Navigation-and-Layout#header-menu",
  },
];

/** The Help panel's "On this page" tips for a route; on a project, those of the open tab. */
export function tipsForRoute(
  name: RouteRecordNameGeneric | null | undefined,
  query: LocationQuery,
): HelpTip[] {
  if (typeof name !== "string") return [];
  if (name === "project-details") {
    const tab = queryString(query[TAB_PARAM]) || DEFAULT_TAB;
    return PROJECT_DETAIL_TIPS[tab as ProjectTabKey] ?? [];
  }
  return HELP_PAGES[name] ?? [];
}
