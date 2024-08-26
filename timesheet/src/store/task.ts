import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TaskData } from "@/types";

export interface TaskState {
    task: TaskData[];
    total_count: number;
    start: number;
    isFetchAgain?: boolean;
    selectedProject: Array<string>;
}

export const initialState: TaskState = {
    task: [],
    total_count: 0,
    start: 0,
    isFetchAgain: false,
    selectedProject: [],
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
            state.start = 0;
            state.isFetchAgain = true;
        },
        setFetchAgain: (state, action: PayloadAction<boolean>) => {
            state.isFetchAgain = action.payload
        }


    },
});

export const { setTaskData, setStart, setSelectedProject,setFetchAgain } = taskSlice.actions;
export default taskSlice.reducer;
