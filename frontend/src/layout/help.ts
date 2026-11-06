import type { FieldHelp } from "@/components/InfoHoverCard";

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
