/**
 * External dependencies.
 */
import { Spinner } from "@next-pms/design-system/components";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useTodos } from "./provider/context";
import { TodoRow } from "./todoRow";
import { useLinkableRecords } from "./useLinkableRecords";
import { useTodosData } from "./useTodosData";

export function Todo() {
  const openCreate = useTodos((c) => c.actions.openCreate);
  const { todos, isLoading, error } = useTodosData();
  const { canLink } = useLinkableRecords();

  if (error) throw error;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink-gray-8">ToDos</h1>
        <Button
          variant="solid"
          label="New ToDo"
          iconLeft={() => <AddSm size={16} />}
          onClick={() => openCreate()}
        />
      </div>

      {isLoading && !todos.length ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : todos.length === 0 ? (
        <p className="py-12 text-center text-base text-ink-gray-5">
          No to-dos yet for this project.
        </p>
      ) : (
        <div className="flex flex-col">
          {todos.map((todo) => (
            <TodoRow
              key={todo.name}
              todo={todo}
              canUnlink={canLink(todo.linked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
