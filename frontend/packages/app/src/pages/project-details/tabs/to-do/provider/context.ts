/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { TodoStatus } from "../create-todo/schema";
import type { CreateTodoInput, Todo, TodoDoc, TodoOwner } from "../types";

export interface TodosContextProps {
  state: {
    todos: Todo[];
    owner: TodoOwner | null;
    isLoading: boolean;
    error: unknown;
    isCreating: boolean;
  };
  actions: {
    createTodo: (input: CreateTodoInput) => Promise<TodoDoc | undefined>;
    updateTodo: (
      name: string,
      input: CreateTodoInput,
    ) => Promise<TodoDoc | undefined>;
    updateTodoStatus: (name: string, status: TodoStatus) => Promise<void>;
    unlinkTodo: (name: string) => Promise<void>;
    deleteTodo: (name: string) => Promise<void>;
    refresh: () => Promise<void>;
  };
}

export const TodosContext = createContext<TodosContextProps>({
  state: {
    todos: [],
    owner: null,
    isLoading: false,
    error: null,
    isCreating: false,
  },
  actions: {
    createTodo: async () => undefined,
    updateTodo: async () => undefined,
    updateTodoStatus: async () => undefined,
    unlinkTodo: async () => undefined,
    deleteTodo: async () => undefined,
    refresh: async () => undefined,
  },
});

export const useTodos = <T>(selector: (state: TodosContextProps) => T) =>
  useContextSelector(TodosContext, selector);
