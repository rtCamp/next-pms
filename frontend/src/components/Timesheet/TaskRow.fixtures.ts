import type { TaskRowTimeEntry } from "./types";

export const WEEK: TaskRowTimeEntry[] = [
  { time: "01:15" },
  { time: "02:00", nonBillable: true },
  { time: "02:30" },
  { time: "" },
  { time: "02:15" },
  { time: "" },
  { time: "" },
];

export const WITH_STATUSES: TaskRowTimeEntry[] = [
  { time: "01:15", status: "Approved", disabled: true },
  { time: "02:00", status: "Approval Pending" },
  { time: "02:30", status: "Rejected" },
  { time: "01:00", status: "Processing Timesheet" },
  { time: "" },
  { time: "", disabled: true },
  { time: "" },
];

export const LOCKED: TaskRowTimeEntry[] = [
  { time: "03:00", disabled: true },
  { time: "", disabled: true },
  { time: "" },
  { time: "" },
  { time: "" },
  { time: "" },
  { time: "" },
];

export const CARD = {
  label: "UI Responsiveness Testing",
  status: "Working",
  projectName: "Blue Harbour CMS Migration",
  dueDate: "2026-10-30",
  actualHours: 9.75,
  estimatedHours: 12,
} as const;
