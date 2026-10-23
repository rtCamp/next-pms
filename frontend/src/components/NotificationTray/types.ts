/** How a message segment is emphasised: `strong` is bold, `subject` is medium weight. */
export type NotificationEmphasis = "strong" | "subject";

export interface NotificationMessageSegment {
  /** Text of the segment. */
  text: string;
  /** Emphasis; plain text when unset. */
  emphasis?: NotificationEmphasis;
}

export interface NotificationEntry {
  /** Unique id, used as the list key. */
  id: string;
  /** Doctype the notification links to; picks the icon, e.g. `"Risk"` or `"Timesheet"`. */
  linkedDoctype: string;
  /** Bold first line. A title containing "mention" gets the @ icon. */
  title?: string;
  /** Body text as segments, so names and subjects can be emphasised. */
  message: NotificationMessageSegment[];
  /** Preformatted time, e.g. `"2h ago"`. */
  timeLabel: string;
  /** Read notifications are hidden from the tray. */
  read?: boolean;
  /** Link target. The item renders as a link when set, else as a button. */
  href?: string;
}

export interface NotificationTrayProps {
  /** Whether the tray is open (v-model:open). */
  open?: boolean;
  /** Notifications to list; only unread ones are shown. */
  notifications: NotificationEntry[];
  /**
   * Tailwind `left-*` class matching the sidebar width, so the tray docks to the sidebar's right edge
   * (e.g. `"left-12"` collapsed, `"left-60"` expanded). Default `"left-0"`.
   */
  offsetClass?: string;
}
