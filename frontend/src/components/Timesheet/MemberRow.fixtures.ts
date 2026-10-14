import type { DayCell } from "./types";

export const AVATAR =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="gray"/></svg>',
  );

export const FULL_WEEK: DayCell[] = [
  { time: "08:30" },
  { time: "08:15" },
  { time: "08:45" },
  { time: "08:30" },
  { time: "07:45" },
  { time: "02:15" },
  { time: "00:30" },
];

export const PARTIAL_WEEK: DayCell[] = [
  { time: "01:00" },
  { time: "02:00" },
  { time: "03:00" },
  { time: "" },
  { time: "04:00" },
  { time: "", disabled: true },
  { time: "", disabled: true },
];
