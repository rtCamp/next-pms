import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type Status = "Open" | "Completed" | "Cancelled";

export interface ProjectData {
  name: string;
  project_name: string;
  status: Status;
  project_type: string;
  percent_complete: number;
  custom_budget_in_hours: number;
  custom_budget_spent_in_hours: number;
  custom_budget_remaining_in_hours: number;
}
export interface ProjectState {
  isFetchAgain: boolean;
  data: ProjectData[];
  start: number;
  selectedProjectType: Array<string>;
  search: string;
  selectedStatus: Array<Status>;
  statusList: Array<Status>;
}

export const initialState: ProjectState = {
  isFetchAgain: false,
  data: [],
  start: 0,
  selectedProjectType: [],
  search: "",
  selectedStatus: [],
  statusList: ["Open", "Completed", "Cancelled"],
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProjectData: (state, action: PayloadAction<Array<ProjectData>>) => {
      state.data = action.payload;
      state.isFetchAgain = false;
    },
    updateProjectData: (state, action: PayloadAction<Array<ProjectData>>) => {
      const existingProjectIds = new Set(
        state.data.map((project) => project.name),
      );
      const newProjects = action.payload.filter(
        (project) => !existingProjectIds.has(project.name),
      );
      state.data = [...state.data, ...newProjects];
      state.isFetchAgain = false;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
      state.isFetchAgain = true;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.data = initialState.data;
      state.isFetchAgain = true;
    },
    setSelectedProjectType: (state, action: PayloadAction<Array<string>>) => {
      state.selectedProjectType = action.payload;
      state.data = initialState.data;
      state.isFetchAgain = true;
    },
    setSelectedStatus: (state, action: PayloadAction<Array<Status>>) => {
      state.selectedStatus = action.payload;
      state.data = initialState.data;
      state.isFetchAgain = true;
    },
    setFilters: (
      state,
      action: PayloadAction<{
        selectedProjectType: Array<string>;
        selectedStatus: Array<Status>;
        search: string;
      }>,
    ) => {
      state.selectedProjectType = action.payload.selectedProjectType;
      state.selectedStatus = action.payload.selectedStatus;
      state.search = action.payload.search;
      state.data = initialState.data;
      state.isFetchAgain = true;
    },
  },
});
export const {
  setProjectData,
  updateProjectData,
  setStart,
  setSearch,
  setSelectedProjectType,
  setSelectedStatus,
  setFilters,
} = projectSlice.actions;
export default projectSlice.reducer;
