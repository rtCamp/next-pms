import type { LookupOption } from "@/composables/useRemoteLookup";
import type { TaskLookupOption } from "@/composables/useTaskLookup";

export type { TaskLookupOption };

/** What the Add time dialog opens with; unset fields start empty. */
export interface AddTimePrefill {
  /** `YYYY-MM-DD`; today when unset. */
  date?: string;
  project?: string;
  projectLabel?: string;
  task?: string;
  taskLabel?: string;
  /** Logs time for this employee (team and project pages). */
  employeeId?: string;
  employeeLabel?: string;
}

/** The time entry being filled in. */
export interface AddTimeEntry {
  /** Used only with the employee picker. */
  employeeId: string;
  employeeLabel: string;
  project: string;
  projectLabel: string;
  task: string;
  taskLabel: string;
  taskStatus: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** Decimal hours. */
  duration: number;
  /** HTML. */
  comment: string;
}

/** A timed event from the user's Google Calendar (`get_user_calendar_events`). */
export interface CalendarEvent {
  id: string;
  subject: string;
  /** `YYYY-MM-DD HH:mm:ss`. */
  starts_on: string;
  ends_on: string;
  all_day: 0 | 1;
  event_type?: string;
}

/** An event picked for the comment. */
export interface SelectedCalendarEvent {
  id: string;
  /** `"<subject> | <duration>"`, the comment's list item. */
  label: string;
}

/** Saves the entry; rejects with the server's error. `keepOpen` is "Save and add another". */
export type AddTimeSave = (
  entry: AddTimeEntry,
  keepOpen: boolean,
) => Promise<unknown>;

export interface AddTimeProps {
  /** Shows the Employee picker (team and project pages); hides calendar events. */
  pickEmployee?: boolean;
  /** Values the entry starts with each time the dialog opens or is reset. */
  prefill?: AddTimePrefill;
  employeeOptions?: LookupOption[];
  employeesLoading?: boolean;
  projectOptions?: LookupOption[];
  projectsLoading?: boolean;
  taskOptions?: TaskLookupOption[];
  tasksLoading?: boolean;
  /** Slider maximum: the employee's daily hours. */
  maxDuration?: number;
  /** Hours the employee has left on the date. */
  hoursLeft?: number;
  /** Turns the duration off with a spinner while the hours left load. */
  hoursLoading?: boolean;
  /** Whether Google Calendar is connected (`boot.is_calendar_setup`). */
  calendarSetup?: boolean;
  /** Timed events from the date on, for "Add calendar events". */
  calendarEvents?: CalendarEvent[];
  calendarLoading?: boolean;
  calendarError?: boolean;
  save: AddTimeSave;
}
