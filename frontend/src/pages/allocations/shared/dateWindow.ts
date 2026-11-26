import { dayjs } from "frappe-ui";
import { DEFAULT_DURATION, DURATION_WEEKS } from "./constants";
import type { AllocationsDuration } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` string as a local-midnight date, or `null` when it isn't a real date. */
export function parseISODate(value: string | null | undefined): Date | null {
  if (!value || !ISO_DATE.test(value)) return null;
  const date = dayjs(value, "YYYY-MM-DD", true);
  return date.isValid() ? date.toDate() : null;
}

/** A date as `YYYY-MM-DD`. */
export function formatISODate(date: Date): string {
  return dayjs(date).format("YYYY-MM-DD");
}

/** The `duration` param as a duration; anything else is the default (this quarter). */
export function parseDuration(value: string): AllocationsDuration {
  return Object.hasOwn(DURATION_WEEKS, value)
    ? (value as AllocationsDuration)
    : DEFAULT_DURATION;
}

/** The `date` param as the day the window starts from; today when it's missing or invalid. */
export function parseAnchorDate(value: string, today = new Date()): Date {
  return parseISODate(value) ?? dayjs(today).startOf("day").toDate();
}

/** Moves the window's date back or forward by the window's length in weeks. */
export function shiftAnchorDate(
  anchorDate: Date,
  duration: AllocationsDuration,
  direction: 1 | -1,
): Date {
  return dayjs(anchorDate)
    .add(direction * DURATION_WEEKS[duration], "week")
    .toDate();
}
