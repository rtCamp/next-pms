/**
 * External dependencies.
 */
import type { ReactNode } from "react";
import { Spinner } from "@next-pms/design-system/components";
import { Button, Tooltip } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useTodos } from "./provider/context";
import { TodoRow } from "./todoRow";
import type { LinkedRecord } from "./types";
import { useLinkedTodos } from "./useLinkedTodos";

type LinkedTodosProps = {
  record: LinkedRecord;
  canEdit: boolean;
  title: ReactNode;
  emptyMessage: string;
};

export function LinkedTodos({
  record,
  canEdit,
  title,
  emptyMessage,
}: LinkedTodosProps) {
  const openCreate = useTodos((c) => c.actions.openCreate);
  const { todos, isLoading } = useLinkedTodos(record);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-2 flex items-center justify-between gap-2">
        {title}
        {canEdit && (
          <Tooltip text="Add ToDo">
            <Button
              type="button"
              variant="ghost"
              className="shrink-0"
              icon={AddSm}
              aria-label="Add ToDo"
              onClick={() => openCreate(record)}
            />
          </Tooltip>
        )}
      </div>
      {isLoading && !todos.length ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : todos.length ? (
        <div className="min-h-0 overflow-y-auto scrollbar-thin">
          {todos.map((todo) => (
            <TodoRow
              key={todo.name}
              todo={todo}
              canUnlink={canEdit}
              condensed
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-gray-5">{emptyMessage}</p>
      )}
    </div>
  );
}
