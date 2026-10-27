/**
 * External dependencies.
 */
import { matchPath } from "react-router";
import type { FieldHelp, HelpTip } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { PERSONAL_TIMESHEET_TIPS } from "@/pages/timesheet/personal/help";

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
];

export const GENERAL_TIPS: HelpTip[] = [
  {
    id: "search",
    title: "Jump anywhere with search",
    body: "Press Ctrl+K (Cmd+K on Mac) from anywhere to jump to a page. Type part of its name to narrow the list.",
    wiki: "Navigation-and-Layout#global-search",
  },
];

export function tipsForPath(pathname: string): HelpTip[] {
  return HELP_PAGES.find(({ route }) => matchPath(route, pathname))?.tips ?? [];
}
