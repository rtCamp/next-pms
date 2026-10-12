/**
 * External dependencies.
 */
import { useMemo } from "react";

/**
 * Internal dependencies.
 */
import type { RecordRef } from "./types";
import { useTodosData } from "./useTodosData";
import { isSameRecord } from "./utils";

export function useLinkedTodos(record: RecordRef | null) {
  const { todos, isLoading } = useTodosData();

  const linkedTodos = useMemo(
    () => (record ? todos.filter((t) => isSameRecord(t.linked, record)) : []),
    [todos, record],
  );

  return { todos: linkedTodos, isLoading };
}
