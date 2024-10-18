import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ProjectNestedTaskData, sortOrder, TaskData } from "@/types";
import { flatTableDataToNestedProjectDataConversion } from "@/lib/utils";
import { getTableProps } from "@/app/pages/task/helper";

export interface TaskState {
  task: TaskData[];
  project: ProjectNestedTaskData[];
  total_count: number;
  start: number;
  isFetchAgain?: boolean;
  selectedProject: Array<string>;
  groupBy: Array<string>;
  selectedTask: string;
  isTaskLogDialogBoxOpen: boolean;
  isAddTaskDialogBoxOpen: boolean;
  pageLength: number,
  order: sortOrder;
  orderColumn: string;
}

export const initialState: TaskState = {
  task: [],
  total_count: 0,
  start: 0,
  isFetchAgain: false,
  selectedProject: [],
  groupBy: [],
  project: [],
  selectedTask: "",
  isTaskLogDialogBoxOpen: false,
  isAddTaskDialogBoxOpen: false,
  pageLength: 20,
  order: getTableProps().order,
  orderColumn: getTableProps().orderColumn,
  
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
      state.isFetchAgain = false;
    },
    updateTaskData: (state, action: PayloadAction<TaskState>) => {
      state.task = [...state.task, ...action.payload.task];
      state.total_count = action.payload.total_count;
      state.isFetchAgain = false;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
      state.pageLength = initialState.pageLength;
      state.isFetchAgain = true;
    },
    setSelectedProject: (state, action: PayloadAction<Array<string>>) => {
      state.selectedProject = action.payload;
      state.task = [];
      state.project = [];
      state.start = 0;
      state.isFetchAgain = true;
    },
    setFetchAgain: (state, action: PayloadAction<boolean>) => {
      state.isFetchAgain = action.payload;
    },
    setGroupBy: (state, action: PayloadAction<Array<string>>) => {
      state.groupBy = action.payload;
      state.task = [];
      state.start = 0;
      state.project = [];
      state.start = 0;
      state.isFetchAgain = true;
    },
    setProjectData: (state) => {
      state.project = flatTableDataToNestedProjectDataConversion(state.task);
      state.isFetchAgain = false;
    },
    updateProjectData: (state) => {
      state.project = flatTableDataToNestedProjectDataConversion(state.task);
      state.isFetchAgain = false;
    },
    setAddTaskDialog: (state, action: PayloadAction<boolean>) => {
      state.isAddTaskDialogBoxOpen = action.payload;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setSelectedTask: (
      state,
      action: PayloadAction<{ task: string; isOpen: boolean }>,
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
      state.isFetchAgain = true;
    },
  },
});

export const {
  setTaskData,
  setStart,
  setSelectedProject,
  setFetchAgain,
  setGroupBy,
  setProjectData,
  updateProjectData,
  updateTaskData,
  setAddTaskDialog,
  setSelectedTask,
  setOrderBy,
} = taskSlice.actions;
export default taskSlice.reducer;
