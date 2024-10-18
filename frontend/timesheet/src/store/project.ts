import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { sortOrder } from "@/types";
import { getTableProps } from "@/app/pages/project/helper";
export type Status = "Open" | "Completed" | "Cancelled";
export type Priority = "Low" | "Medium" | "High";
export type Billability =
  | "Non-Billable"
  | "Fixed Cost"
  | "Retainer"
  | "Time and Material";
export type CompletionMethod =
  | "Manual"
  | "Task Completion"
  | "Task Progress"
  | "Task Weight";
export interface ProjectData {
  name: string;
  project_name: string;
  customer: string;
  project_type: string;
  custom_business_unit: string;
  priority: Priority;
  company: string;
  custom_billing_type: Billability;
  custom_currency: string;
  estimated_costing: number;
  percent_complete_method: CompletionMethod;
  actual_start_date: string;
  actual_end_date: string;
  actual_time: number;
  total_sales_amount: number;
  total_billable_amount: number;
  total_billed_amount: number;
  total_costing_amount: number;
  total_expense_claim: number;
  custom_total_hours_purchased: number;
  custom_total_hours_remaining: number;
  custom_percentage_estimated_cost: number;
  gross_margin: number;
  per_gross_margin: number;
  status: Status;
}

export interface ProjectState {
  isFetchAgain: boolean;
  data: ProjectData[];
  start: number;
  selectedProjectType: Array<string>;
  search: string;
  selectedStatus: Array<Status>;
  statusList: Array<Status>;
  order: sortOrder;
  orderColumn: string;
  pageLength: number;
  selectedBusinessUnit: Array<string>;
}

export const initialState: ProjectState = {
  isFetchAgain: false,
  data: [],
  start: 0,
  pageLength: 20,
  selectedProjectType: [],
  search: "",
  selectedStatus: [],
  selectedBusinessUnit: [],
  statusList: ["Open", "Completed", "Cancelled"],
  order: getTableProps().order,
  orderColumn: getTableProps().orderColumn,
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
      state.data = [...state.data, ...action.payload];
      state.isFetchAgain = false;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
      state.pageLength = initialState.pageLength;
      state.isFetchAgain = true;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
      state.data = initialState.data;
      state.isFetchAgain = true;
    },
    setSelectedProjectType: (state, action: PayloadAction<Array<string>>) => {
      state.selectedProjectType = action.payload;
      state.data = initialState.data;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
      state.isFetchAgain = true;
    },
    setSelectedStatus: (state, action: PayloadAction<Array<Status>>) => {
      state.selectedStatus = action.payload;
      state.data = initialState.data;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
      state.isFetchAgain = true;
    },
    setSelectedBusinessUnit: (state, action: PayloadAction<Array<string>>) => {
      state.selectedBusinessUnit = action.payload;
      state.data = initialState.data;
      state.isFetchAgain = true;
    },
    setFilters: (
      state,
      action: PayloadAction<{
        selectedProjectType: Array<string>;
        selectedStatus: Array<Status>;
        search: string;
        selectedBusinessUnit: Array<string>;
      }>,
    ) => {
      state.selectedProjectType = action.payload.selectedProjectType;
      state.selectedStatus = action.payload.selectedStatus;
      state.selectedBusinessUnit = action.payload.selectedBusinessUnit;
      state.search = action.payload.search;
      state.data = initialState.data;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
      state.isFetchAgain = true;
    },
    setOrderBy: (
      state,
      action: PayloadAction<{ order: sortOrder; orderColumn: string }>,
    ) => {
      const pageLength = state.data.length;
      state.pageLength = pageLength;
      state.start = 0;
      state.order = action.payload.order;
      state.orderColumn = action.payload.orderColumn;
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
  setOrderBy,
  setSelectedBusinessUnit
} = projectSlice.actions;
export default projectSlice.reducer;
