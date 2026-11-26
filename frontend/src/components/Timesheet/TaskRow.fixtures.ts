import type { TaskRowTimeEntry } from "./types";

export const WEEK: TaskRowTimeEntry[] = [
  { date: "2025-12-29", time: "01:15" },
  { date: "2025-12-30", time: "02:00", nonBillable: true },
  { date: "2025-12-31", time: "02:30" },
  { date: "2026-01-01", time: "" },
  { date: "2026-01-02", time: "02:15" },
  { date: "2026-01-03", time: "" },
  { date: "2026-01-04", time: "" },
];

export const WITH_STATUSES: TaskRowTimeEntry[] = [
  { date: "2025-12-29", time: "01:15", status: "Approved", disabled: true },
  { date: "2025-12-30", time: "02:00", status: "Approval Pending" },
  { date: "2025-12-31", time: "02:30", status: "Rejected" },
  { date: "2026-01-01", time: "01:00", status: "Processing Timesheet" },
  { date: "2026-01-02", time: "" },
  { date: "2026-01-03", time: "", disabled: true },
  { date: "2026-01-04", time: "" },
];

export const LOCKED: TaskRowTimeEntry[] = [
  { date: "2025-12-29", time: "03:00", disabled: true },
  { date: "2025-12-30", time: "", disabled: true },
  { date: "2025-12-31", time: "" },
  { date: "2026-01-01", time: "" },
  { date: "2026-01-02", time: "" },
  { date: "2026-01-03", time: "" },
  { date: "2026-01-04", time: "" },
];

export const CARD = {
  label: "UI Responsiveness Testing",
  status: "Working",
  projectName: "Blue Harbour CMS Migration",
  dueDate: "2026-10-30",
  actualHours: 9.75,
  estimatedHours: 12,
} as const;
