/**
 * External dependencies.
 */
import { useFrappeGetCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "@/pages/project-details/context";
import { TODO_API, todosKey } from "./constants";
import type { Todo } from "./types";

const NO_TODOS: Todo[] = [];

export function useTodosData() {
  const projectId = useProjectDetail((s) => s.projectId);

  const { data, isLoading, error } = useFrappeGetCall<{ message: Todo[] }>(
    `${TODO_API}.get_project_todos`,
    { project: projectId },
    projectId ? todosKey(projectId) : null,
    { keepPreviousData: true },
  );

  return { todos: data?.message ?? NO_TODOS, isLoading, error };
}
