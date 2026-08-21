/**
 * External dependencies.
 */
import { differenceInCalendarDays } from "date-fns";

/**
 * Internal dependencies.
 */
import type { TimeoffPortion } from "../../types";

/**
 * Builds the label for a time-off bar. Half days are named by the half they
 * cover, matching the wording used on the team timesheet.
 */
export function getTimeoffLabel(
  startDate: Date,
  endDate: Date,
  portion: TimeoffPortion = "full",
): string {
  if (portion === "first") {
    return "First half off";
  }
  if (portion === "second") {
    return "Second half off";
  }
  if (portion === "half") {
    return "Half day off";
  }

  const days = differenceInCalendarDays(endDate, startDate) + 1;

  return `${days} ${days === 1 ? "day" : "days"} off`;
}
