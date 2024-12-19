/**
 * External dependencies.
 */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */
import { sortOrder } from "@/types";

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
  data: ProjectData[];
  start: number;
  selectedProjectType: Array<string>;
  search: string;
  selectedStatus: Array<Status>;
  selectedBillingType: Array<string>;
  statusList: Array<Status>;
  order: sortOrder;
  orderColumn: string;
  pageLength: number;
  selectedBusinessUnit: Array<string>;
  totalCount: number;
  currency: string
}

export const initialState: ProjectState = {
  selectedBillingType: [],
  data: [],
  start: 0,
  pageLength: 20,
  selectedProjectType: [],
  search: "",
  selectedStatus: [],
  selectedBusinessUnit: [],
  statusList: ["Open", "Completed", "Cancelled"],
  order: "desc",
  orderColumn: "project_name",
  totalCount: 0,
  currency: ""
};

export const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setProjectData: (state, action: PayloadAction<Array<ProjectData>>) => {
      state.data = action.payload;
    },
    updateProjectData: (state, action: PayloadAction<Array<ProjectData>>) => {
      state.data = [...state.data, ...action.payload];
    },
    setStart: (state) => {
      state.start = 0;
      state.pageLength = state.data.length + initialState.pageLength;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
      state.data = initialState.data;
    },
    setSelectedProjectType: (state, action: PayloadAction<Array<string>>) => {
      state.selectedProjectType = action.payload;
      // state.data = initialState.data;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
    },
    setSelectedStatus: (state, action: PayloadAction<Array<Status>>) => {
      state.selectedStatus = action.payload;
      // state.data = initialState.data;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
    },
    setSelectedBusinessUnit: (state, action: PayloadAction<Array<string>>) => {
      state.selectedBusinessUnit = action.payload;
      // state.data = initialState.data;
    },
    setSelectedBilingType: (state, action: PayloadAction<Array<string>>) => {
      state.selectedBillingType = action.payload;
      // state.data = initialState.data;
    },
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload;
      // state.data = initialState.data;
    },
    setFilters: (
      state,
      action: PayloadAction<{
        selectedProjectType: Array<string>;
        selectedStatus: Array<Status>;
        search: string;
        selectedBusinessUnit: Array<string>;
        order: sortOrder;
        orderColumn: string;
        currency: string
        selectedBillingType: Array<string>
      }>,
    ) => {
      state.selectedProjectType = action.payload.selectedProjectType;
      state.selectedStatus = action.payload.selectedStatus;
      state.selectedBusinessUnit = action.payload.selectedBusinessUnit;
      state.search = action.payload.search;
      state.order = action.payload.order;
      state.orderColumn = action.payload.orderColumn;
      state.start = initialState.start;
      state.pageLength = initialState.pageLength;
      state.order = action.payload.order;
      state.orderColumn = action.payload.orderColumn;
      state.currency = action.payload.currency;
      state.selectedBillingType = action.payload.selectedBillingType;
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
    },
    setTotalCount: (state, action: PayloadAction<number>) => {
      state.totalCount = action.payload;
    },
    refreshData: (state) => {
      const pageLength = state.data.length;
      state.pageLength = pageLength;
      state.start = 0;
      state.data = initialState.data;

    }
  },
});

export const {
  setProjectData,
  updateProjectData,
  refreshData,
  setStart,
  setSearch,
  setSelectedProjectType,
  setSelectedStatus,
  setFilters,
  setOrderBy,
  setCurrency,
  setTotalCount,
  setSelectedBusinessUnit,
  setSelectedBilingType
} = projectSlice.actions;

export default projectSlice.reducer;
