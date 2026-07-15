export type NotificationEmphasis = "strong" | "subject";

export interface NotificationMessageSegment {
  text: string;
  emphasis?: NotificationEmphasis;
}

export interface NotificationEntry {
  id: string;
  linkedDoctype: string;
  title?: string;
  message: NotificationMessageSegment[];
  timeLabel: string;
  read?: boolean;
  href?: string;
}
