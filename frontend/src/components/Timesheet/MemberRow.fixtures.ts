import type { DayCell } from "./types";

export const AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="gray"/></svg>',
  );

export const FULL_WEEK: DayCell[] = [
  { date: "2025-12-29", time: "08:30" },
  { date: "2025-12-30", time: "08:15" },
  { date: "2025-12-31", time: "08:45" },
  { date: "2026-01-01", time: "08:30" },
  { date: "2026-01-02", time: "07:45" },
  { date: "2026-01-03", time: "02:15" },
  { date: "2026-01-04", time: "00:30" },
];

export const PARTIAL_WEEK: DayCell[] = [
  { date: "2025-12-29", time: "01:00" },
  { date: "2025-12-30", time: "02:00" },
  { date: "2025-12-31", time: "03:00" },
  { date: "2026-01-01", time: "" },
  { date: "2026-01-02", time: "04:00" },
  { date: "2026-01-03", time: "", disabled: true },
  { date: "2026-01-04", time: "", disabled: true },
];
