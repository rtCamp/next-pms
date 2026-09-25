/**
 * External dependencies.
 */
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import type { EmployeeOnLeave } from "../../types";

function formatLeaveDate(isoDate: string): string {
  return format(parseISO(isoDate), "dd MMM yyyy");
}

export function formatLeaveDayType(leave: EmployeeOnLeave): string {
  if (!leave.half_day) return "Full day";
  const normalized = (leave.custom_first_halfsecond_half ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "first half") return "First half";
  if (normalized === "second half") return "Second half";
  return "Half day";
}

export function formatLeaveWindow(leave: EmployeeOnLeave): string {
  const range = `${formatLeaveDate(leave.from_date)} → ${formatLeaveDate(leave.to_date)}`;
  if (!leave.half_day) return range;
  return `${range} · ${formatLeaveDayType(leave)}`;
}

export function formatLeaveDateRange(leave: EmployeeOnLeave): string {
  const from = parseISO(leave.from_date);
  const to = parseISO(leave.to_date);
  if (leave.from_date === leave.to_date) return format(from, "d MMM yyyy");
  return `${format(from, "d MMM")} – ${format(to, "d MMM yyyy")}`;
}

export function formatLeaveDuration(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export function sortOpenLeavesFirst(
  leaves: EmployeeOnLeave[],
): EmployeeOnLeave[] {
  const statusOrder = (leave: EmployeeOnLeave) =>
    leave.status === "Open" ? 0 : 1;
  return [...leaves].sort((a, b) => statusOrder(a) - statusOrder(b));
}
