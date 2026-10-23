/** A ToDo status: one of the ToDo doctype's options (`boot.todo_status_options`). */
export type TodoStatus = string;
/** The statuses the app has an icon and colour for; any other is shown as Open. */
export type KnownTodoStatus =
  "Open" | "Backlog" | "In Progress" | "Closed" | "Cancelled";
export type TodoPriority = "Low" | "Medium" | "High";

/** A `ToDo` row as the list reads it. */
export interface TodoDoc {
  name: string;
  allocated_to: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  reference_type: string;
  reference_name: string;
  creation: string;
  modified: string;
  /** rtcamp custom fields, read only when `boot.has_todo_custom_fields`. */
  custom_title?: string | null;
  custom_from_time?: string | null;
  custom_to_time?: string | null;
}

export interface TodoUser {
  name: string;
  full_name: string | null;
  user_image: string | null;
}

export type LinkedRecordType = "Milestone" | "Touchpoint" | "Growth Initiative";

/** A record ToDos can be linked to: a Project Timeline Item or a PMS Growth Initiative. */
export interface LinkedRecord {
  doctype: string;
  name: string;
  title: string;
  type: LinkedRecordType;
}

export type RecordRef = Pick<LinkedRecord, "doctype" | "name">;

/** `get_todo_links`: the record each linked ToDo belongs to, by ToDo name. */
export type TodoLinks = Record<string, LinkedRecord>;

/** A ToDo with its assignee's name and avatar and its linked record resolved. */
export interface Todo extends TodoDoc {
  /** The assignee's full name, or their email when the User can't be read. */
  assigneeName: string;
  assigneeImage: string | null;
  linked: LinkedRecord | null;
}

/** The create / edit dialog's values. */
export interface TodoForm {
  title: string;
  description: string;
  status: TodoStatus;
  assignee: string;
  startAt: string;
  endAt: string;
  priority: TodoPriority;
  linkedTo: LinkedRecord | null;
}

export type TodoErrors = Partial<Record<keyof TodoForm, string>>;
