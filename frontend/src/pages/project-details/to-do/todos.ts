import { dayjs } from "frappe-ui";
import {
  SEARCH_PARAM,
  TYPE_PARAM,
  VIEW_PARAM,
} from "@/pages/project-details/calendar/constants";
import { TAB_PARAM } from "@/pages/project-details/constants";
import { systemToLocalDateTime } from "@/utils/date";
import {
  DEFAULT_TODO_STATUSES,
  GROWTH_DETAIL_PARAM,
  LINKED_RECORD_GROUPS,
  LINKED_RECORD_ICON,
  STATUS_COLOR,
  STATUS_HOVER_COLOR,
  STATUS_ICON,
} from "./constants";
import type {
  KnownTodoStatus,
  LinkedRecord,
  RecordRef,
  Todo,
  TodoDoc,
  TodoErrors,
  TodoForm,
  TodoLinks,
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

/**
 * Each ToDo with its assignee's name and avatar (the email stands in for an unreadable
 * User) and the record it is linked to.
 */
export function resolveTodos(
  todos: TodoDoc[],
  users: TodoUser[],
  links: TodoLinks,
): Todo[] {
  const byName = new Map(users.map((user) => [user.name, user]));
  return todos.map((todo) => {
    const user = byName.get(todo.allocated_to);
    return {
      ...todo,
      assigneeName: user?.full_name || todo.allocated_to,
      assigneeImage: user?.user_image || null,
      linked: links[todo.name] ?? null,
    };
  });
}

/** The distinct assignees of `todos`, sorted, for the User lookup. */
export function assigneeIds(todos: TodoDoc[]): string[] {
  return [
    ...new Set(todos.map((todo) => todo.allocated_to).filter(Boolean)),
  ].sort();
}

export function emptyTodoForm(
  userId: string,
  linkedTo: LinkedRecord | null = null,
): TodoForm {
  return {
    title: "",
    description: "",
    status: "Open",
    assignee: userId,
    startAt: "",
    endAt: "",
    priority: "Medium",
    linkedTo,
  };
}

export function todoToForm(todo: Todo): TodoForm {
  return {
    title: todo.custom_title ?? "",
    description: todo.description ?? "",
    status: todo.status,
    assignee: todo.allocated_to ?? "",
    startAt: todo.custom_from_time ?? "",
    endAt: todo.custom_to_time ?? "",
    priority: todo.priority,
    linkedTo: todo.linked,
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
  todo: Pick<Todo, "custom_title" | "description" | "linked">,
) {
  const linked = todo.linked
    ? ` It will also be removed from the ${todo.linked.type.toLowerCase()} "${todo.linked.title}".`
    : "";
  return `Are you sure you want to delete the ToDo "${todoTitle(todo)}"?${linked} This action cannot be undone.`;
}

export function unlinkTodoMessage(
  todo: Pick<Todo, "custom_title" | "description">,
  record: LinkedRecord,
) {
  return `Are you sure you want to unlink the ToDo "${todoTitle(todo)}" from the ${record.type.toLowerCase()} "${record.title}"? The ToDo will not be deleted.`;
}

export function linkKey(record: RecordRef): string {
  return `${record.doctype}/${record.name}`;
}

export function isSameRecord(
  a: RecordRef | null | undefined,
  b: RecordRef | null | undefined,
): boolean {
  return Boolean(a && b && a.doctype === b.doctype && a.name === b.name);
}

/** `"1 ToDo"`, `"3 ToDos"`. */
export function formatTodoCount(count: number): string {
  return `${count} ${count === 1 ? "ToDo" : "ToDos"}`;
}

/** The linked ToDos by `linkKey` of their record, each list in list order. */
export function todosByRecord(todos: Todo[]): Map<string, Todo[]> {
  const byRecord = new Map<string, Todo[]>();
  for (const todo of todos) {
    if (!todo.linked) continue;
    const key = linkKey(todo.linked);
    const linked = byRecord.get(key);
    if (linked) linked.push(todo);
    else byRecord.set(key, [todo]);
  }
  return byRecord;
}

/** The "Linked to" options, grouped by type; empty groups are left out. */
export function linkOptions(records: LinkedRecord[]) {
  return LINKED_RECORD_GROUPS.map(({ type, label }) => ({
    group: label,
    options: records
      .filter((record) => record.type === type)
      .map((record) => ({
        label: record.title,
        value: linkKey(record),
        icon: LINKED_RECORD_ICON[record.type],
      })),
  })).filter((group) => group.options.length > 0);
}

/**
 * The query a linked record's chip opens: the Growth tab on the initiative, or the
 * Calendar's list searched for the milestone or touchpoint, as React did.
 */
export function linkedRecordQuery(
  record: LinkedRecord,
): Record<string, string> {
  if (record.type === "Growth Initiative") {
    return { [TAB_PARAM]: "growth", [GROWTH_DETAIL_PARAM]: record.name };
  }
  return {
    [TAB_PARAM]: "calendar",
    [VIEW_PARAM]: "list",
    [TYPE_PARAM]: record.type === "Milestone" ? "milestones" : "touchpoints",
    [SEARCH_PARAM]: record.title,
  };
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
