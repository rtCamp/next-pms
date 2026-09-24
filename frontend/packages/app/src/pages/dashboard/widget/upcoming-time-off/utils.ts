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

function formatHalfDayLabel(half: string | null): string {
  const normalized = (half ?? "").trim().toLowerCase();
  if (normalized === "first half") return "First half";
  if (normalized === "second half") return "Second half";
  return "Half day";
}

export function formatLeaveWindow(leave: EmployeeOnLeave): string {
  const range = `${formatLeaveDate(leave.from_date)} → ${formatLeaveDate(leave.to_date)}`;
  if (!leave.half_day) return range;
  return `${range} · ${formatHalfDayLabel(leave.custom_first_halfsecond_half)}`;
}

export function sortOpenLeavesFirst(
  leaves: EmployeeOnLeave[],
): EmployeeOnLeave[] {
  const statusOrder = (leave: EmployeeOnLeave) =>
    leave.status === "Open" ? 0 : 1;
  return [...leaves].sort((a, b) => statusOrder(a) - statusOrder(b));
}
