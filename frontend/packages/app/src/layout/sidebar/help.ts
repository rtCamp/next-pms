/**
 * External dependencies.
 */
import { matchPath } from "react-router";
import type { FieldHelp, HelpTip } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import {
  ALLOCATION_DIALOG_TIPS,
  PROJECT_ALLOCATION_TIPS,
  TEAM_ALLOCATION_TIPS,
} from "@/pages/allocations/help";
import {
  LEADERSHIP_DASHBOARD_TIPS,
  MANAGER_DASHBOARD_TIPS,
} from "@/pages/dashboard/help";
import { TAB_PARAM } from "@/pages/project-details/constants";
import { PROJECT_DETAIL_TIPS } from "@/pages/project-details/help";
import type { TabKey } from "@/pages/project-details/tabs";
import { PROJECTS_TIPS } from "@/pages/projects/help";
import { TASKS_TIPS } from "@/pages/tasks/help";
import { PERSONAL_TIMESHEET_TIPS } from "@/pages/timesheet/personal/help";
import { PROJECT_TIMESHEET_TIPS } from "@/pages/timesheet/project/help";
import { TEAM_TIMESHEET_TIPS } from "@/pages/timesheet/team/help";

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

const HELP_PAGES: { route: string; tips: HelpTip[] }[] = [
  { route: ROUTES["timesheet-personal"], tips: PERSONAL_TIMESHEET_TIPS },
  { route: ROUTES["timesheet-team"], tips: TEAM_TIMESHEET_TIPS },
  { route: ROUTES["timesheet-project"], tips: PROJECT_TIMESHEET_TIPS },
  { route: ROUTES["dashboard-manager"], tips: MANAGER_DASHBOARD_TIPS },
  { route: ROUTES["dashboard-leadership"], tips: LEADERSHIP_DASHBOARD_TIPS },
  {
    route: ROUTES["allocations-team"],
    tips: [...TEAM_ALLOCATION_TIPS, ...ALLOCATION_DIALOG_TIPS],
  },
  {
    route: ROUTES["allocations-project"],
    tips: [...PROJECT_ALLOCATION_TIPS, ...ALLOCATION_DIALOG_TIPS],
  },
  { route: ROUTES.project, tips: PROJECTS_TIPS },
  { route: ROUTES.task, tips: TASKS_TIPS },
];

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

export function tipsForPath(pathname: string, search: string): HelpTip[] {
  if (matchPath(`${ROUTES.project}/:projectId`, pathname)) {
    const tab = new URLSearchParams(search).get(TAB_PARAM) ?? "overview";
    return PROJECT_DETAIL_TIPS[tab as TabKey] ?? [];
  }
  return HELP_PAGES.find(({ route }) => matchPath(route, pathname))?.tips ?? [];
}
