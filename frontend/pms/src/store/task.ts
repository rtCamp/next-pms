/**
 * External dependencies.
 */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */
import { sortOrder, TaskData } from "@/types";


export interface TaskState {
  task: TaskData[];
  total_count: number;
  start: number;
  isFetchAgain?: boolean;
  selectedProject: Array<string>;
  selectedTask: string;
  isTaskLogDialogBoxOpen: boolean;
  isAddTaskDialogBoxOpen: boolean;
  pageLength: number;
  search: string;
  selectedStatus: Array<TaskStatusType>;
  order: sortOrder;
  orderColumn: string;
}
export type TaskStatusType =
  | "Open"
  | "Working"
  | "Pending Review"
  | "Overdue"
  | "Template"
  | "Completed"
  | "Cancelled";
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
};

export type AddTaskType = {
  subject: string;
  project: string;
  expected_time: string;
  description: string;
};

export const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setTaskData: (state, action: PayloadAction<TaskState>) => {
      state.task = action.payload.task;
      state.total_count = action.payload.total_count;
    },
    updateTaskData: (state, action: PayloadAction<TaskState>) => {
      state.task = [...state.task, ...action.payload.task];
      state.total_count = action.payload.total_count;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
      state.pageLength = initialState.pageLength;
    },
    setSelectedProject: (state, action: PayloadAction<Array<string>>) => {
      state.selectedProject = action.payload;
      state.task = [];

      state.start = 0;
    },
    setAddTaskDialog: (state, action: PayloadAction<boolean>) => {
      state.isAddTaskDialogBoxOpen = action.payload;
      state.start = 0;
    },
    setSelectedTask: (
      state,
      action: PayloadAction<{ task: string; isOpen: boolean }>
    ) => {
      state.selectedTask = action.payload.task;
      state.isTaskLogDialogBoxOpen = action.payload.isOpen;
    },
    setOrderBy: (
      state,
      action: PayloadAction<{ order: sortOrder; orderColumn: string }>,
    ) => {
      const pageLength = state.task.length;
      state.pageLength = pageLength;
      state.start = 0;
      state.order = action.payload.order;
      state.orderColumn = action.payload.orderColumn;
      state.task = initialState.task;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
      state.task = initialState.task;
    },
    setSelectedStatus: (
      state,
      action: PayloadAction<Array<TaskStatusType>>
    ) => {
      state.selectedStatus = action.payload;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
    },
    setFilters: (
      state,
      action: PayloadAction<{
        selectedStatus: Array<TaskStatusType>;
        search: string;
        selectedProject: Array<string>;
      }>
    ) => {
      state.selectedProject = action.payload.selectedProject;
      state.selectedStatus = action.payload.selectedStatus;
      state.search = action.payload.search;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
    },
    setTotalCount: (state, action: PayloadAction<number>) => {
      state.total_count = action.payload;
    },
    refreshData: (state) => {
      const pageLength = state.task.length;
      state.pageLength = pageLength;
      state.start = 0;
      state.task = initialState.task;

    }
  },
});

export const {
  setTaskData,
  setStart,
  setSelectedProject,
  updateTaskData,
  setAddTaskDialog,
  setSelectedTask,
  setOrderBy,
  setSearch,
  setSelectedStatus,
  setFilters,
  setTotalCount,
  refreshData
} = taskSlice.actions;

export default taskSlice.reducer;
