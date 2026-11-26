import type { TimeOffEntry } from "./types";

export const ENTRIES: TimeOffEntry[] = [
  { time: "" },
  { time: "" },
  { time: "08:00" },
  { time: "" },
  { time: "08:00", holiday: true, holidayDescription: "Christmas" },
  { time: "", holiday: true },
  { time: "", holiday: true },
];

export const TOTAL = "16:00";
