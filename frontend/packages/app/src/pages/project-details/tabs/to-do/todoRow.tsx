/**
 * External dependencies.
 */
import { Avatar, Dropdown } from "@rtcamp/frappe-ui-react";
import { Calendar, DotHorizontal } from "@rtcamp/frappe-ui-react/icons";
import { format, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import { useTodos } from "./context";
import type { TodoPriority } from "./create-todo/schema";
import type { Todo } from "./types";

const PRIORITY_DOT_CLASS: Record<TodoPriority, string> = {
  Low: "bg-surface-green-5",
  Medium: "bg-surface-amber-5",
  High: "bg-surface-red-5",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return format(parseISO(value.replace(" ", "T")), "d MMM , hh:mm a")
      .replace("AM", "am")
      .replace("PM", "pm");
  } catch {
    return value;
  }
}

type TodoRowProps = {
  todo: Todo;
  onEdit: (todo: Todo) => void;
};

export function TodoRow({ todo, onEdit }: TodoRowProps) {
  const updateTodoStatus = useTodos((c) => c.actions.updateTodoStatus);
  const deleteTodo = useTodos((c) => c.actions.deleteTodo);

  const isClosed = todo.status === "Closed";
  const assigneeHref = `/desk/user/${encodeURIComponent(todo.allocated_to)}`;

  return (
    <div className="flex items-center gap-4 border-b border-outline-gray-2 py-4">
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-medium text-ink-gray-8">
          {todo.custom_title || "Untitled"}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-gray-5">
          <a
            href={assigneeHref}
            className="flex items-center gap-1.5 hover:text-ink-gray-7"
          >
            <Avatar
              size="xs"
              shape="circle"
              label={todo.allocated_to_full_name}
              image={todo.allocated_to_image || undefined}
            />
            <span className="truncate">{todo.allocated_to_full_name}</span>
          </a>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {formatDateTime(todo.custom_from_time)}
          </span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {formatDateTime(todo.custom_to_time)}
          </span>
          <span aria-hidden>·</span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={`inline-block size-2 rounded-full ${PRIORITY_DOT_CLASS[todo.priority]}`}
            />
            {todo.priority}
          </span>
        </div>
      </div>

      <button
        type="button"
        aria-label={isClosed ? "Mark as open" : "Mark as closed"}
        onClick={() =>
          updateTodoStatus(todo.name, isClosed ? "Open" : "Closed")
        }
        className={`size-5 shrink-0 rounded-full border transition-colors ${
          isClosed
            ? "border-ink-gray-7 bg-ink-gray-7"
            : "border-outline-gray-3 hover:border-ink-gray-7"
        }`}
      />

      <Dropdown
        placement="right"
        button={{ variant: "ghost", icon: DotHorizontal }}
        options={[
          {
            label: "Edit",
            key: "edit",
            onClick: () => onEdit(todo),
          },
          {
            label: "Delete",
            key: "delete",
            theme: "red",
            onClick: () => deleteTodo(todo.name),
          },
        ]}
      />
    </div>
  );
}
