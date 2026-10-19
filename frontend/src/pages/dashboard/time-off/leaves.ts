import { dayjs } from "frappe-ui";

/** A row of `get_employees_on_leave`. */
export interface EmployeeOnLeave {
  name: string;
  employee: string;
  employee_name: string;
  from_date: string;
  to_date: string;
  status: "Open" | "Approved";
  leave_type: string;
  total_leave_days: number;
  half_day: 0 | 1;
  custom_first_halfsecond_half: string | null;
  description: string | null;
  user_image: string | null;
  /** `false` for a leave the user is only notified about. Older backends omit it. */
  can_approve?: boolean;
}

export function awaitsApproval(leave: EmployeeOnLeave): boolean {
  return leave.status === "Open" && leave.can_approve !== false;
}

export function leaveDayType(leave: EmployeeOnLeave): string {
  if (!leave.half_day) return "Full day";
  const half = (leave.custom_first_halfsecond_half ?? "").trim().toLowerCase();
  if (half === "first half") return "First half";
  if (half === "second half") return "Second half";
  return "Half day";
}

/** e.g. `"02 Oct 2026 → 04 Oct 2026"`, with the half for a half day. */
export function leaveWindow(leave: EmployeeOnLeave): string {
  const date = (iso: string) => dayjs(iso).format("DD MMM YYYY");
  const range = `${date(leave.from_date)} → ${date(leave.to_date)}`;
  return leave.half_day ? `${range} · ${leaveDayType(leave)}` : range;
}

/** e.g. `"2 Oct 2026"` for one day, `"2 Oct – 4 Oct 2026"` for several. */
export function leaveDateRange(leave: EmployeeOnLeave): string {
  const from = dayjs(leave.from_date);
  if (leave.from_date === leave.to_date) return from.format("D MMM YYYY");
  return `${from.format("D MMM")} – ${dayjs(leave.to_date).format("D MMM YYYY")}`;
}

export function leaveDuration(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

/** Open (pending) leaves first, otherwise in the API's order. */
export function openLeavesFirst(leaves: EmployeeOnLeave[]): EmployeeOnLeave[] {
  const rank = (leave: EmployeeOnLeave) => (leave.status === "Open" ? 0 : 1);
  return [...leaves].sort((a, b) => rank(a) - rank(b));
}
