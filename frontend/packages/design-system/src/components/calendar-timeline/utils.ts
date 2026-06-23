/**
 * External dependencies.
 */
import { addDays, format, startOfWeek } from "date-fns";

/**
 * Internal dependencies.
 */
import type { CalendarTimelineEvent } from "./types";

export const getVisibleDays = (rangeStart: Date, days: number): Date[] =>
  Array.from({ length: days }, (_, index) => addDays(rangeStart, index));

export const getWeekStart = (date: Date): Date =>
  startOfWeek(date, { weekStartsOn: 1 });

export const getRangeLabel = (rangeStart: Date, days: number): string => {
  const end = addDays(rangeStart, days - 1);
  const sameYear = rangeStart.getFullYear() === end.getFullYear();
  const startLabel = format(rangeStart, sameYear ? "MMM d" : "MMM d, yyyy");
  return `${startLabel} - ${format(end, "MMM d, yyyy")}`;
};

export const groupEventsByDay = (
  events: CalendarTimelineEvent[],
): Map<string, CalendarTimelineEvent[]> => {
  const grouped = new Map<string, CalendarTimelineEvent[]>();
  for (const event of events) {
    const existing = grouped.get(event.date);
    if (existing) existing.push(event);
    else grouped.set(event.date, [event]);
  }
  return grouped;
};
