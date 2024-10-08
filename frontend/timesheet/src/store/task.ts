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
  total_project_count: number;
  selectedTask: string;
  isTaskLogDialogBoxOpen: boolean;
  isAddTaskDialogBoxOpen: boolean;
}

export const initialState: TaskState = {
  task: [],
  total_count: 0,
  start: 0,
  isFetchAgain: false,
  selectedProject: [],
  groupBy: [],
  project: [],
  total_project_count: 0,
  selectedTask: "",
  isTaskLogDialogBoxOpen: false,
  isAddTaskDialogBoxOpen: false,
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
      const existingTaskIds = new Set(state.task.map((task) => task.name));
      const newTasks = action.payload.task.filter(
        (task) => !existingTaskIds.has(task.name),
      );
      state.task = [...state.task, ...newTasks];
      state.total_count = action.payload.total_count;
      state.isFetchAgain = false;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
      state.isFetchAgain = true;
    },
    setSelectedProject: (state, action: PayloadAction<Array<string>>) => {
      state.selectedProject = action.payload;
      state.task = [];
      state.project = [];
      state.start = 0;
      state.isFetchAgain = true;
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
      state.isFetchAgain = false; // as we dont want data to load for flat structure table
      state.start = 0;
      state.isFetchAgain = true;
    },
    setProjectData: (state) => {
      state.project = flatTableDataToNestedProjectDataConversion(state.task);
      state.total_project_count = flatTableDataToNestedProjectDataConversion(
        state.task,
      ).length;
      state.isFetchAgain = false;
    },
    updateProjectData: (state) => {
      const existingProjectIds = new Set(
        state.project.map((project) => project.name),
      );
      const newProjects = flatTableDataToNestedProjectDataConversion(
        state.task,
      ).filter((project) => !existingProjectIds.has(project.name));
      state.project = [...state.project, ...newProjects];
      state.total_project_count = state.total_project_count =
        flatTableDataToNestedProjectDataConversion(state.task).length;
      state.isFetchAgain = false;
    },
    setAddTaskDialog: (state, action: PayloadAction<boolean>) => {
      state.isAddTaskDialogBoxOpen = action.payload;
      state.start = 0;
      state.isFetchAgain = true;
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
} = taskSlice.actions;
export default taskSlice.reducer;
