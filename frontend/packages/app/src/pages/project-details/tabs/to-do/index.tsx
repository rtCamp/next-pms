/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Spinner } from "@next-pms/design-system/components";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { CreateTodoModal } from "./create-todo";
import { TodosProvider } from "./provider";
import { useTodos } from "./provider/context";
import { TodoRow } from "./todoRow";
import type { Todo } from "./types";

function TodoContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const todos = useTodos((s) => s.state.todos);
  const isLoading = useTodos((s) => s.state.isLoading);
  const error = useTodos((s) => s.state.error);

  if (error) throw error;

  const handleEdit = useCallback((todo: Todo) => {
    setEditingTodo(todo);
  }, []);

  const modalOpen = isCreateOpen || editingTodo !== null;
  const closeModal = useCallback(() => {
    setIsCreateOpen(false);
    setEditingTodo(null);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink-gray-8">ToDos</h1>
        <Button
          variant="solid"
          label="New ToDo"
          iconLeft={() => <AddSm size={16} />}
          onClick={() => setIsCreateOpen(true)}
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
            <TodoRow key={todo.name} todo={todo} onEdit={handleEdit} />
          ))}
        </div>
      )}

      <CreateTodoModal
        open={modalOpen}
        onClose={closeModal}
        todo={editingTodo}
      />
    </div>
  );
}

export function Todo() {
  return (
    <TodosProvider>
      <TodoContent />
    </TodosProvider>
  );
}
