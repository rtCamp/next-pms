import { DOCTYPE_ICONS, FALLBACK_ICON, MENTION_ICON } from "./constants";
import type { NotificationEntry } from "./types";

/** The icon class for a notification: @ for mentions, else by linked doctype. */
export function notificationIcon(
  notification: Pick<NotificationEntry, "title" | "linkedDoctype">,
): string {
  if (notification.title?.toLowerCase().includes("mention"))
    return MENTION_ICON;
  return DOCTYPE_ICONS[notification.linkedDoctype] ?? FALLBACK_ICON;
}
