/**
 * Internal dependencies.
 */
import type { sortOrder, TaskData } from "@/types";
import type { taskStateActionType, TaskStatusType } from "@/types/task";

export interface TaskState {
  task: TaskData[];
  total_count: number;
  start: number;
  isFetchAgain?: boolean;
  selectedProject: string[];
  selectedTask: string;
  isTaskLogDialogBoxOpen: boolean;
  isAddTaskDialogBoxOpen: boolean;
  pageLength: number;
  search: string;
  selectedStatus: TaskStatusType[];
  order: sortOrder;
  orderColumn: string;
  hasMore: boolean;
  isLoading: boolean;
  isNeedToFetchDataAfterUpdate: boolean;
  action: taskStateActionType;
}

export type Action =
  | { type: "SET_TASK_DATA"; payload: Partial<TaskState> }
  | { type: "UPDATE_TASK_DATA"; payload: { task: TaskData[] } }
  | { type: "SET_START"; payload: number }
  | { type: "SET_REFETCH_DATA"; payload: boolean }
  | { type: "SET_SELECTED_PROJECT"; payload: string[] }
  | { type: "SET_ADD_TASK_DIALOG"; payload: boolean }
  | { type: "SET_SELECTED_TASK"; payload: { task: string; isOpen: boolean } }
  | { type: "SET_ORDER_BY"; payload: { order: sortOrder; orderColumn: string } }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_SELECTED_STATUS"; payload: TaskStatusType[] }
  | {
      type: "SET_FILTERS";
      payload: {
        selectedStatus: TaskStatusType[];
        search: string;
        selectedProject: string[];
      };
    }
  | { type: "SET_TOTAL_COUNT"; payload: number }
  | { type: "REFRESH_DATA" };
