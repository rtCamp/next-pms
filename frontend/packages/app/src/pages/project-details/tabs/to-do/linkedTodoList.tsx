/**
 * External dependencies.
 */
import type { ReactNode } from "react";
import { Spinner } from "@next-pms/design-system/components";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useTodos } from "./provider/context";
import { TodoRow } from "./todoRow";
import type { Todo } from "./types";
import { formatTodoCount } from "./utils";

type LinkedTodoListProps = {
  title: ReactNode;
  emptyMessage: string;
  onAdd: () => void;
  onEdit: (todo: Todo) => void;
};

export function LinkedTodoList({
  title,
  emptyMessage,
  onAdd,
  onEdit,
}: LinkedTodoListProps) {
  const todos = useTodos((c) => c.state.todos);
  const isLoading = useTodos((c) => c.state.isLoading);
  const linkedCount = useTodos((c) => c.state.owner?.todos.length ?? 0);
  const canEdit = useTodos((c) => Boolean(c.state.owner?.canEdit));
  const hiddenCount = isLoading ? 0 : linkedCount - todos.length;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2">
        {title}
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            icon={AddSm}
            aria-label="Add ToDo"
            onClick={onAdd}
          />
        )}
      </div>
      {isLoading && !todos.length ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : (
        todos.map((todo) => (
          <TodoRow key={todo.name} todo={todo} onEdit={onEdit} condensed />
        ))
      )}
      {!isLoading && !linkedCount && (
        <p className="text-sm text-ink-gray-5">{emptyMessage}</p>
      )}
      {hiddenCount > 0 && (
        <p className="pt-2 text-sm text-ink-gray-5">
          {todos.length
            ? `${hiddenCount} more not visible to you`
            : `${formatTodoCount(hiddenCount)} not visible to you`}
        </p>
      )}
    </div>
  );
}
