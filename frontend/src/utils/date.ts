import { dayjs, dayjsLocal } from "frappe-ui";

/** Start of the Monday-based week containing `date`, at local midnight. */
export function getWeekStart(date: Date): Date {
  const day = dayjs(date).startOf("day");
  return day.subtract((day.day() + 6) % 7, "day").toDate();
}

/** `days` consecutive dates starting at `rangeStart`. */
export function getVisibleDays(rangeStart: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, index) =>
    dayjs(rangeStart).add(index, "day").toDate(),
  );
}

/**
 * Label for the `days`-long range starting at `rangeStart`, e.g. `"Oct 12 - Oct 25, 2026"`.
 * The start shows its year only when the range crosses a year boundary.
 */
export function getRangeLabel(rangeStart: Date, days: number): string {
  const start = dayjs(rangeStart);
  const end = start.add(days - 1, "day");
  const startLabel = start.format(
    start.year() === end.year() ? "MMM D" : "MMM D, YYYY",
  );
  return `${startLabel} - ${end.format("MMM D, YYYY")}`;
}

/**
 * A `YYYY-MM-DD` date as `"MMM D"`, with the year added when it isn't the current one,
 * e.g. `"Oct 15"` or `"Mar 2, 2025"`.
 */
export function formatProjectDate(isoDate: string): string {
  const date = dayjs(isoDate, "YYYY-MM-DD");
  return date.format(date.year() === dayjs().year() ? "MMM D" : "MMM D, YYYY");
}

/**
 * A `YYYY-MM-DD HH:mm:ss` date-time in the system time zone, in the user's time zone
 * (frappe-ui's `systemTimezone` and `localTimezone`); `""` when unset.
 */
export function systemToLocalDateTime(
  value: string | null | undefined,
): string {
  if (!value) return "";
  const date = dayjsLocal(value);
  return date.isValid() ? date.format("YYYY-MM-DD HH:mm:ss") : value;
}
