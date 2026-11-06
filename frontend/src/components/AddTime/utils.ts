import { dayjs } from "frappe-ui";
import { stripTags } from "@/utils/text";
import type {
  AddTimeEntry,
  AddTimePrefill,
  CalendarEvent,
  SelectedCalendarEvent,
} from "./types";

function minutesBetween(startsOn: string, endsOn: string) {
  return dayjs(endsOn).diff(dayjs(startsOn), "minute");
}

/** An event's length, e.g. `"45m"`, `"1hr"`, `"1hr 30m"`. */
export function formatEventDuration(startsOn: string, endsOn: string): string {
  const total = Math.max(minutesBetween(startsOn, endsOn), 0);
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes === 0 ? `${hours}hr` : `${hours}hr ${minutes}m`;
}

/** The comment's list items for these events, in the events' order. */
export function toSelectedEvents(
  events: CalendarEvent[],
): SelectedCalendarEvent[] {
  return events.map((event) => ({
    id: event.id,
    label: `${event.subject.trim()} | ${formatEventDuration(event.starts_on, event.ends_on)}`,
  }));
}

/** The events' total length in decimal hours. */
export function totalEventHours(events: CalendarEvent[]): number {
  return events.reduce(
    (sum, event) => sum + minutesBetween(event.starts_on, event.ends_on) / 60,
    0,
  );
}

export function entryFromPrefill(prefill: AddTimePrefill): AddTimeEntry {
  return {
    employeeId: prefill.employeeId ?? "",
    employeeLabel: prefill.employeeLabel || prefill.employeeId || "",
    project: prefill.project ?? "",
    projectLabel: prefill.projectLabel || prefill.project || "",
    task: prefill.task ?? "",
    taskLabel: prefill.taskLabel || prefill.task || "",
    taskStatus: "",
    date: prefill.date || dayjs().format("YYYY-MM-DD"),
    duration: 0,
    comment: "",
  };
}

export type AddTimeErrors = Partial<
  Record<
    "employeeId" | "project" | "task" | "date" | "duration" | "comment",
    string
  >
>;

/** The React form's messages; the employee is checked only when it is picked. */
export function validateEntry(
  entry: AddTimeEntry,
  pickEmployee: boolean,
): AddTimeErrors {
  const errors: AddTimeErrors = {};
  if (pickEmployee && !entry.employeeId.trim()) {
    errors.employeeId = "Please select an employee.";
  }
  if (!entry.project.trim()) errors.project = "Select Project";
  if (!entry.task.trim()) errors.task = "Select Task";
  if (!entry.date.trim()) errors.date = "Select Date";
  if (!(entry.duration > 0)) errors.duration = "Select Duration";
  if (!stripTags(entry.comment).trim()) {
    errors.comment = "Please enter a comment.";
  }
  return errors;
}

/** The search text of a lookup: in input mode the combobox puts the selected label in the query, which is no search. */
export function lookupQuery(query: string, selectedLabel: string): string {
  return query === selectedLabel ? "" : query;
}
