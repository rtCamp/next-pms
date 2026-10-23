import { dayjs } from "frappe-ui";
import { systemToLocalDateTime } from "@/utils/date";
import {
  DEFAULT_TODO_STATUSES,
  STATUS_COLOR,
  STATUS_HOVER_COLOR,
  STATUS_ICON,
} from "./constants";
import type {
  KnownTodoStatus,
  Todo,
  TodoDoc,
  TodoErrors,
  TodoForm,
  TodoStatus,
  TodoUser,
} from "./types";

/** Whether the site has the rtcamp ToDo fields: title, start and end. */
export function hasTodoCustomFields(): boolean {
  return Boolean(window.boot?.has_todo_custom_fields);
}

/** The ToDo fields the list reads; the custom ones only when the site has them. */
export function todoFields(customFields: boolean): (keyof TodoDoc)[] {
  return [
    "name",
    "allocated_to",
    "description",
    "status",
    "priority",
    "reference_type",
    "reference_name",
    "creation",
    "modified",
    ...(customFields
      ? (["custom_title", "custom_from_time", "custom_to_time"] as const)
      : []),
  ];
}

function htmlText(html: string): string {
  return (
    new DOMParser().parseFromString(html, "text/html").body.textContent ?? ""
  ).trim();
}

/** The custom title, else the description's text, else "Untitled". */
export function todoTitle(todo: Pick<TodoDoc, "custom_title" | "description">) {
  return todo.custom_title || htmlText(todo.description ?? "") || "Untitled";
}

/**
 * A start or end time, stored in system time, in the user's time zone as `"3 Mar, 02:30 pm"`;
 * `"—"` when unset.
 */
export function formatTodoDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  if (!dayjs(value).isValid()) return value;
  return dayjs(systemToLocalDateTime(value)).format("D MMM, hh:mm a");
}

/** Each ToDo with its assignee's name and avatar; the email stands in for an unreadable User. */
export function withAssignees(todos: TodoDoc[], users: TodoUser[]): Todo[] {
  const byName = new Map(users.map((user) => [user.name, user]));
  return todos.map((todo) => {
    const user = byName.get(todo.allocated_to);
    return {
      ...todo,
      assigneeName: user?.full_name || todo.allocated_to,
      assigneeImage: user?.user_image || null,
    };
  });
}

/** The distinct assignees of `todos`, sorted, for the User lookup. */
export function assigneeIds(todos: TodoDoc[]): string[] {
  return [
    ...new Set(todos.map((todo) => todo.allocated_to).filter(Boolean)),
  ].sort();
}

export function emptyTodoForm(userId: string): TodoForm {
  return {
    title: "",
    description: "",
    status: "Open",
    assignee: userId,
    startAt: "",
    endAt: "",
    priority: "Medium",
  };
}

export function todoToForm(todo: TodoDoc): TodoForm {
  return {
    title: todo.custom_title ?? "",
    description: todo.description ?? "",
    status: todo.status,
    assignee: todo.allocated_to ?? "",
    startAt: todo.custom_from_time ?? "",
    endAt: todo.custom_to_time ?? "",
    priority: todo.priority,
  };
}

/** React's rules: Title, Start and End are required only with the custom fields. */
export function validateTodo(
  form: TodoForm,
  customFields: boolean,
): TodoErrors {
  const errors: TodoErrors = {};
  if (customFields && !form.title.trim()) errors.title = "Title is required.";
  if (!form.assignee.trim()) errors.assignee = "Assignee is required.";
  if (customFields && !form.startAt.trim())
    errors.startAt = "Start is required.";
  if (customFields && !form.endAt.trim()) errors.endAt = "End is required.";
  if (
    form.startAt &&
    form.endAt &&
    !errors.endAt &&
    dayjs(form.endAt).isBefore(dayjs(form.startAt))
  ) {
    errors.endAt = "End must be on or after start.";
  }
  return errors;
}

/** The ToDo fields a create or edit writes. */
export function toTodoFields(
  form: TodoForm,
  customFields: boolean,
): Partial<TodoDoc> {
  return {
    description: form.description,
    status: form.status,
    allocated_to: form.assignee,
    priority: form.priority,
    ...(customFields
      ? {
          custom_title: form.title,
          custom_from_time: form.startAt,
          custom_to_time: form.endAt,
        }
      : {}),
  };
}

export function deleteTodoMessage(
  todo: Pick<TodoDoc, "custom_title" | "description">,
) {
  return `Are you sure you want to delete the ToDo "${todoTitle(todo)}"? This action cannot be undone.`;
}

/** The ToDo doctype's statuses from the boot data, else the stock ones. */
export function todoStatuses(): TodoStatus[] {
  const options = window.boot?.todo_status_options;
  return options?.length ? options : DEFAULT_TODO_STATUSES;
}

function knownStatus(status: string): KnownTodoStatus {
  return Object.hasOwn(STATUS_ICON, status)
    ? (status as KnownTodoStatus)
    : "Open";
}

/** The status's icon; a status the app doesn't know gets Open's. */
export function statusIcon(status: string): string {
  return STATUS_ICON[knownStatus(status)];
}

/** The status's colour; a status the app doesn't know gets Open's. */
export function statusColor(status: string): string {
  return STATUS_COLOR[knownStatus(status)];
}

/** The status button's hover colour; none for Closed and Cancelled. */
export function statusHoverColor(status: string): string | undefined {
  return STATUS_HOVER_COLOR[knownStatus(status)];
}

/** The status options, plus `current` when it isn't one of them, so it still shows. */
export function statusOptions(current: string) {
  const statuses = todoStatuses();
  const all =
    !current || statuses.includes(current) ? statuses : [...statuses, current];
  return all.map((status) => ({ label: status, value: status }));
}
