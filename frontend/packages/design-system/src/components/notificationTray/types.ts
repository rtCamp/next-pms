export type NotificationEmphasis = "strong" | "subject";

export interface NotificationMessageSegment {
  text: string;
  emphasis?: NotificationEmphasis;
}

export interface NotificationEntry {
  id: string;
  name: string;
  image?: string;
  message: NotificationMessageSegment[];
  timeLabel: string;
  read?: boolean;
  href?: string;
}
