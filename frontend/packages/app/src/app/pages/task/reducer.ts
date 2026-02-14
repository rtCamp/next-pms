/**
 * Internal dependencies.
 */
import type { sortOrder, TaskData } from "@/types";
import type { TaskStatusType } from "@/types/task";
import type { TaskState } from "./types";

export const initialState: TaskState = {
  task: [],
  total_count: 0,
  start: 0,
  isFetchAgain: false,
  selectedProject: [],
  selectedTask: "",
  isTaskLogDialogBoxOpen: false,
  isAddTaskDialogBoxOpen: false,
  pageLength: 20,
  search: "",
  selectedStatus: ["Open", "Working"],
  order: "desc",
  orderColumn: "modified",
  hasMore: true,
  isLoading: true,
  isNeedToFetchDataAfterUpdate: false,
  action: "SET",
};

const actionHandlers = {
  SET_TASK_DATA: (
    state: TaskState,
    payload: Partial<TaskState>,
  ): TaskState => ({
    ...state,
    ...payload,
    hasMore: payload.has_more,
    isLoading: false,
  }),
  UPDATE_TASK_DATA: (
    state: TaskState,
    payload: { task: TaskData[] },
  ): TaskState => ({
    ...state,
    task: [...state.task, ...payload.task],
    hasMore: payload.has_more,
    isLoading: false,
  }),
  SET_START: (state: TaskState, payload: number): TaskState => ({
    ...state,
    start: payload,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
    action: "UPDATE",
  }),
  SET_REFETCH_DATA: (state: TaskState, payload: boolean): TaskState => ({
    ...state,
    isNeedToFetchDataAfterUpdate: payload,
  }),
  SET_SELECTED_PROJECT: (state: TaskState, payload: string[]): TaskState => ({
    ...state,
    selectedProject: payload,
    task: [],
    start: 0,
    isLoading: true,
    action: "SET",
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_ADD_TASK_DIALOG: (state: TaskState, payload: boolean): TaskState => ({
    ...state,
    isAddTaskDialogBoxOpen: payload,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
    start: 0,
    action: "SET",
  }),
  SET_SELECTED_TASK: (
    state: TaskState,
    payload: { task: string; isOpen: boolean },
  ): TaskState => ({
    ...state,
    selectedTask: payload.task,
    isTaskLogDialogBoxOpen: payload.isOpen,
  }),
  SET_ORDER_BY: (
    state: TaskState,
    payload: { order: sortOrder; orderColumn: string },
  ): TaskState => ({
    ...state,
    order: payload.order,
    orderColumn: payload.orderColumn,
    task: [],
    start: 0,
    isLoading: true,
    action: "SET",
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_SEARCH: (state: TaskState, payload: string): TaskState => ({
    ...state,
    search: payload,
    isLoading: true,
    action: "SET",
    isNeedToFetchDataAfterUpdate: true,
    start: 0,
    task: [],
  }),
  SET_SELECTED_STATUS: (
    state: TaskState,
    payload: TaskStatusType[],
  ): TaskState => ({
    ...state,
    selectedStatus: payload,
    start: 0,
    isLoading: true,
    action: "SET",
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_FILTERS: (
    state: TaskState,
    payload: {
      selectedStatus: TaskStatusType[];
      search: string;
      selectedProject: string[];
    },
  ): TaskState => ({
    ...state,
    selectedProject: payload.selectedProject,
    selectedStatus: payload.selectedStatus,
    search: payload.search,
    start: 0,
    isLoading: true,
    action: "SET",
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_TOTAL_COUNT: (state: TaskState, payload: number): TaskState => ({
    ...state,
    total_count: payload,
  }),
  REFRESH_DATA: (state: TaskState): TaskState => ({
    ...state,
    task: [],
    start: 0,
    isLoading: true,
    action: "SET",
    isNeedToFetchDataAfterUpdate: true,
  }),
};

export const reducer = (state: TaskState, action: Action): TaskState => {
  const handler = actionHandlers[action.type];
  return handler ? handler(state, action.payload as never) : state;
};
