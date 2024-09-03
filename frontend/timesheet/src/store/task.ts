import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ProjectData, ProjectNestedTaskData, TaskData } from "@/types";

export interface TaskState {
  task: TaskData[];
  project: ProjectNestedTaskData[];
  total_count: number;
  start: number;
  isFetchAgain?: boolean;
  selectedProject: Array<string>;
  groupBy: Array<string>;
  total_project_count: number;
  projectStart: number;
  projectIsFetchAgain: boolean;
}

export const initialState: TaskState = {
  task: [],
  total_count: 0,
  start: 0,
  isFetchAgain: false,
  selectedProject: [],
  groupBy: [],
  project: [],
  projectStart: 0,
  projectIsFetchAgain: false,
  total_project_count: 0,
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
      state.isFetchAgain = true;
    },
    setProjectStart: (state, action: PayloadAction<number>) => {
      state.projectStart = action.payload;
      state.projectIsFetchAgain = true;
    },
    setSelectedProject: (state, action: PayloadAction<Array<string>>) => {
      state.selectedProject = action.payload;
      state.task = [];
      state.project = [];
      state.start = 0;
      state.isFetchAgain = true;
      state.projectStart = 0;
      state.projectIsFetchAgain = true;
    },
    setFetchAgain: (state, action: PayloadAction<boolean>) => {
      state.isFetchAgain = action.payload;
    },
    setProjectFetchAgain: (state, action: PayloadAction<boolean>) => {
      state.projectIsFetchAgain = action.payload;
    },
    setGroupBy: (state, action: PayloadAction<Array<string>>) => {
      state.groupBy = action.payload;
      state.task = [];
      state.start = 0;
      state.project = [];
      state.start = 0;
      state.isFetchAgain = false; // as we dont want data to load for flat structure table
      state.projectStart = 0;
      state.projectIsFetchAgain = true;
    },
    setProjectData: (state, action: PayloadAction<ProjectData>) => {
      state.project = action.payload.projects;
      state.total_project_count = action.payload.count;
      state.projectIsFetchAgain = false;
    },
    updateProjectData: (state, action: PayloadAction<ProjectData>) => {
      state.project = [...state.project, ...action.payload.projects];
      state.total_project_count = action.payload.count;
      state.projectIsFetchAgain = false;
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
  setProjectStart,
  setProjectFetchAgain,
} = taskSlice.actions;
export default taskSlice.reducer;
