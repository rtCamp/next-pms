/**
 * External dependencies.
 */
import { format, parse } from "date-fns";

export function formatProjectDate(isoDate: string): string {
  // Parse YYYY-MM-DD as a local date, not UTC, so negative-offset viewers
  // don't see the previous day.
  const date = parse(isoDate, "yyyy-MM-dd", new Date());
  const pattern =
    date.getFullYear() === new Date().getFullYear()
      ? "MMM d"
      : "MMM d, yyyy";
  return format(date, pattern);
}
