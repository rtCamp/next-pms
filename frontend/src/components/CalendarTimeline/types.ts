/** Colour of an event chip. */
export type CalendarEventColor = "violet" | "blue";

export interface CalendarTimelineEvent {
  /** Unique id, used as the list key. */
  id: string;
  /** First line of the chip. */
  title: string;
  /** Second, lighter line of the chip, e.g. the project name. */
  subtitle?: string;
  /** Day the event falls on, as `YYYY-MM-DD`. */
  date: string;
  /** Chip colour. Default `"blue"`. */
  color?: CalendarEventColor;
}

export interface CalendarTimelineProps {
  /** Events to place on the grid; events outside the visible range are ignored. */
  events: CalendarTimelineEvent[];
  /** First visible day. */
  rangeStart: Date;
  /** Number of visible days (grid columns). Default `DEFAULT_VISIBLE_DAYS` (14). */
  days?: number;
  /** Day to highlight as today. Nothing is highlighted when unset. */
  today?: Date;
  /** Header label. Defaults to the range, e.g. `"Oct 12 - Oct 25, 2026"`. */
  rangeLabel?: string;
}

export interface EventChipProps {
  /** First line of the chip. */
  title: string;
  /** Second, lighter line of the chip. */
  subtitle?: string;
  /** Chip colour. Default `"blue"`. */
  color?: CalendarEventColor;
}
