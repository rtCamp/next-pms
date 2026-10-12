/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { TodoStatus } from "../create-todo/schema";
import type { CreateTodoInput, LinkedRecord, Todo, TodoDoc } from "../types";

export interface TodosContextProps {
  state: {
    isDialogOpen: boolean;
    isSaving: boolean;
  };
  actions: {
    openCreate: (linkedTo?: LinkedRecord) => void;
    openEdit: (todo: Todo) => void;
    createTodo: (input: CreateTodoInput) => Promise<TodoDoc | undefined>;
    updateTodo: (
      todo: Todo,
      input: CreateTodoInput,
    ) => Promise<TodoDoc | undefined>;
    updateTodoStatus: (name: string, status: TodoStatus) => Promise<void>;
    requestUnlink: (todo: Todo) => void;
    requestDelete: (todo: Todo) => void;
  };
}

export const TodosContext = createContext<TodosContextProps>({
  state: {
    isDialogOpen: false,
    isSaving: false,
  },
  actions: {
    openCreate: () => undefined,
    openEdit: () => undefined,
    createTodo: async () => undefined,
    updateTodo: async () => undefined,
    updateTodoStatus: async () => undefined,
    requestUnlink: () => undefined,
    requestDelete: () => undefined,
  },
});

export const useTodos = <T>(selector: (state: TodosContextProps) => T) =>
  useContextSelector(TodosContext, selector);
