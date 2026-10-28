import type { DayChipState } from "./types";

export const STATES: DayChipState[] = [
  "default",
  "active",
  "selected",
  "disabled",
  "skeleton",
];

export const DAYS = [
  { date: "2026-10-29", dayLabel: "Thu", dayNumber: 29 },
  { date: "2026-10-30", dayLabel: "Fri", dayNumber: 30 },
  {
    date: "2026-10-31",
    dayLabel: "Sat",
    dayNumber: 31,
    isLocked: true,
    tooltip: "Weekly off",
  },
  {
    date: "2026-11-01",
    dayLabel: "Sun",
    dayNumber: 1,
    monthLabel: "Nov",
    isMonthBoundary: true,
  },
  { date: "2026-11-02", dayLabel: "Mon", dayNumber: 2 },
];
