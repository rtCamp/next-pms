import { dayjs, type MultiSelectOption } from "frappe-ui";
import type {
  CalendarEventColor,
  CalendarTimelineEvent,
} from "@/components/CalendarTimeline";

/** A row of `get_calendar_timeline_items`; only the fields the widget reads. */
export interface CalendarItem {
  name: string;
  title: string;
  project: string;
  project_name: string | null;
  type: string;
  start_date: string;
}

const TYPE_COLOR: Record<string, CalendarEventColor> = {
  Milestone: "violet",
  Touchpoint: "blue",
};

/** One option per project among the items, labelled with the project name. */
export function projectOptions(items: CalendarItem[]): MultiSelectOption[] {
  const byName = new Map<string, string>();
  for (const item of items) {
    byName.set(item.project, item.project_name ?? item.project);
  }
  return Array.from(byName, ([value, label]) => ({ value, label }));
}

/** The items of the selected projects (all when none is selected) as chips. */
export function calendarEvents(
  items: CalendarItem[],
  projects: string[],
): CalendarTimelineEvent[] {
  return items
    .filter((item) => projects.length === 0 || projects.includes(item.project))
    .map((item) => ({
      id: item.name,
      title: item.title,
      subtitle: item.project_name ?? item.project,
      date: item.start_date.slice(0, 10),
      color: TYPE_COLOR[item.type] ?? "blue",
    }));
}

/** The header text as React wrote it, e.g. `"Oct 12 – Oct 25, 2026"`. */
export function calendarRangeLabel(rangeStart: Date, days: number): string {
  const start = dayjs(rangeStart);
  const end = start.add(days - 1, "day");
  return `${start.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
}
