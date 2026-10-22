export type TodoStatus = "Open" | "Closed" | "Cancelled";
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

/** A ToDo with its assignee's name and avatar resolved. */
export interface Todo extends TodoDoc {
  /** The assignee's full name, or their email when the User can't be read. */
  assigneeName: string;
  assigneeImage: string | null;
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
}

export type TodoErrors = Partial<Record<keyof TodoForm, string>>;
