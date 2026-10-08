/**
 * External dependencies.
 */
import type { ReactNode } from "react";

/**
 * Internal dependencies.
 */
import { CreateTodoModal } from "./create-todo";
import { TodosProvider } from "./provider";
import type { Todo, TodoOwner } from "./types";
import { useTodoModal } from "./useTodoModal";

type LinkedTodosProps = {
  owner: TodoOwner;
  onOwnerChange: () => void;
  enabled?: boolean;
  children: (handlers: {
    openCreate: () => void;
    openEdit: (todo: Todo) => void;
  }) => ReactNode;
};

export function LinkedTodos({
  owner,
  onOwnerChange,
  enabled,
  children,
}: LinkedTodosProps) {
  const { isOpen, editingTodo, openCreate, openEdit, close } = useTodoModal();

  return (
    <TodosProvider
      owner={owner}
      onOwnerChange={onOwnerChange}
      enabled={enabled}
    >
      {children({ openCreate, openEdit })}
      <CreateTodoModal open={isOpen} onClose={close} todo={editingTodo} />
    </TodosProvider>
  );
}
