import type { CalendarEventColor } from "./types";

export const DEFAULT_VISIBLE_DAYS = 14;

export const WEEKEND_DAY_INDICES = [0, 6];

export const EVENT_CHIP_CLASSES: Record<
  CalendarEventColor,
  { chip: string; title: string; subtitle: string }
> = {
  violet: {
    chip: "bg-surface-violet-2",
    title: "text-ink-violet-7",
    subtitle: "text-ink-violet-4",
  },
  blue: {
    chip: "bg-surface-blue-2",
    title: "text-ink-blue-7",
    subtitle: "text-ink-blue-4",
  },
};
