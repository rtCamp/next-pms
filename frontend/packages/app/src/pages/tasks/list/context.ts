/**
 * External dependencies.
 */
import { createContext, useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type { TaskListItem } from "./types";
import type { AddTaskPrefill } from "../components/add-task/type";

export interface TaskListContextProps {
  state: {
    data: TaskListItem[];
    hasMore: boolean;
    isLoading: boolean;
    isInitialLoad: boolean;
    isFilterRequest: boolean;
    error: unknown;
    addTaskOpen: boolean;
    addTaskPrefill: AddTaskPrefill | null;
    editTaskName: string | null;
  };
  actions: {
    loadMore: () => void;
    refresh: () => void;
    deleteTask: (name: string) => Promise<void>;
    openAddTaskModal: (prefill?: AddTaskPrefill) => void;
    openEditTaskModal: (task: TaskListItem) => void;
    closeAddTaskModal: () => void;
  };
}

const noop = () => {};
const noopAsync = async () => {};

export const TaskListContext = createContext<TaskListContextProps>({
  state: {
    data: [],
    hasMore: false,
    isLoading: false,
    isInitialLoad: false,
    isFilterRequest: false,
    error: null,
    addTaskOpen: false,
    addTaskPrefill: null,
    editTaskName: null,
  },
  actions: {
    loadMore: noop,
    refresh: noop,
    deleteTask: noopAsync,
    openAddTaskModal: noop,
    openEditTaskModal: noop,
    closeAddTaskModal: noop,
  },
});

export const useTaskList = <T>(selector: (state: TaskListContextProps) => T) =>
  useContextSelector(TaskListContext, selector);
