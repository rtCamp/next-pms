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
  };
}

const noop = () => {};

export const TaskListContext = createContext<TaskListContextProps>({
  state: {
    data: [],
    hasMore: false,
    isLoading: false,
    error: null,
  },
  actions: {
    loadMore: noop,
  },
});

export const useTaskList = <T>(selector: (state: TaskListContextProps) => T) =>
  useContextSelector(TaskListContext, selector);
