import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ProjectData, ProjectNestedTaskData, TaskData } from "@/types";

export interface TaskState {
    task: TaskData[];
    project:ProjectNestedTaskData[]
    total_count: number;
    start: number;
    isFetchAgain?: boolean;
    selectedProject: Array<string>;
    groupBy: Array<string>;
    total_project_count: number;
}

export const initialState: TaskState = {
    task: [],
    total_count: 0,
    start: 0,
    isFetchAgain: false,
    selectedProject: [],
    groupBy:[],
    project:[],
    total_project_count:0,
}

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
        setSelectedProject: (state, action: PayloadAction<Array<string>>) => {
            state.selectedProject = action.payload;
            state.task = [];
            state.project = [];
            state.start = 0;
            state.isFetchAgain = true;
        },
        setFetchAgain: (state, action: PayloadAction<boolean>) => {
            state.isFetchAgain = action.payload
        },
        setGroupBy: (state, action: PayloadAction<Array<string>>) => {
            state.groupBy = action.payload;
            state.task = [];
            state.start = 0;
            state.isFetchAgain = true;
        },
        setProjectData: (state, action: PayloadAction<ProjectData>) => {
            state.project = action.payload.projects;
            state.total_project_count = action.payload.count;
            state.isFetchAgain = false;
        },
        updateProjectData: (state, action: PayloadAction<ProjectData>) => {
            state.project = [...state.project, ...action.payload.projects];
            state.total_project_count = action.payload.count;
            state.isFetchAgain = false;
        }

    },
});

export const { setTaskData, setStart, setSelectedProject,setFetchAgain,setGroupBy,setProjectData,updateProjectData } = taskSlice.actions;
export default taskSlice.reducer;
