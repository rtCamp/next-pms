import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ProjectNestedTaskData, TaskData } from "@/types";
import { flatTableDataToNestedProjectDataConversion } from "@/lib/utils";

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
      state.project = [];
      state.start = 0;
    },
    setGroupBy: (state, action: PayloadAction<Array<string>>) => {
      state.groupBy = action.payload;
    },
    setProjectData: (state) => {
      state.project = flatTableDataToNestedProjectDataConversion(state.task);
    },
    updateProjectData: (state) => {
      state.project = flatTableDataToNestedProjectDataConversion(state.task);
    },
    setAddTaskDialog: (state, action: PayloadAction<boolean>) => {
      state.isAddTaskDialogBoxOpen = action.payload;
      state.start = 0;
    },
    setSelectedTask: (
      state,
      action: PayloadAction<{ task: string; isOpen: boolean }>,
    ) => {
      state.selectedTask = action.payload.task;
      state.isTaskLogDialogBoxOpen = action.payload.isOpen;
    },
    setOrderBy: (state) => {
      const pageLength = state.task.length;
      state.pageLength = pageLength;
      state.start = 0;
      state.task = initialState.task;
    },
  },
});

export const {
  setTaskData,
  setStart,
  setSelectedProject,
  setGroupBy,
  setProjectData,
  updateProjectData,
  updateTaskData,
  setAddTaskDialog,
  setSelectedTask,
  setOrderBy,
} = taskSlice.actions;
export default taskSlice.reducer;
