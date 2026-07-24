/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { TaskListItem } from "./types";

export interface TaskListContextProps {
  state: {
    data: TaskListItem[];
    hasMore: boolean;
    isLoading: boolean;
    error: unknown;
  };
  actions: {
    loadMore: () => void;
    refresh: () => void;
    deleteTask: (name: string) => Promise<void>;
  };
}

const noop = () => {};
const noopAsync = async () => {};

export const TaskListContext = createContext<TaskListContextProps>({
  state: {
    data: [],
    hasMore: false,
    isLoading: false,
    error: null,
  },
  actions: {
    loadMore: noop,
    refresh: noop,
    deleteTask: noopAsync,
  },
});

export const useTaskList = <T>(selector: (state: TaskListContextProps) => T) =>
  useContextSelector(TaskListContext, selector);
