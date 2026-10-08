/**
 * External dependencies.
 */
import { useCallback, useState } from "react";

/**
 * Internal dependencies.
 */
import type { Todo } from "./types";

export function useTodoModal() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const openCreate = useCallback(() => setIsCreateOpen(true), []);
  const openEdit = useCallback((todo: Todo) => setEditingTodo(todo), []);
  const close = useCallback(() => {
    setIsCreateOpen(false);
    setEditingTodo(null);
  }, []);

  return {
    isOpen: isCreateOpen || editingTodo !== null,
    editingTodo,
    openCreate,
    openEdit,
    close,
  };
}
