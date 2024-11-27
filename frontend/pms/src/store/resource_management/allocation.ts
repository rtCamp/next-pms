import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type ResourceKeys =
  | "project"
  | "employee"
  | "is_billable"
  | "customer"
  | "total_allocated_hours"
  | "hours_allocated_per_day"
  | "allocation_start_date"
  | "allocation_end_date"
  | "note";

export type AllocationDataProps = {
  isShowDialog: boolean;
  isNeedToEdit: boolean;
  employee: string;
  is_billable: boolean;
  project: string;
  project_name: string;
  customer: string;
  customer_name: string;
  total_allocated_hours: number;
  hours_allocated_per_day: number;
  allocation_start_date: string;
  allocation_end_date: string;
  note: string;
  name: string;
};

const initialState = {
  isShowDialog: false,
  isNeedToEdit: false,
  employee: "",
  is_billable: false,
  project: "",
  project_name: "",
  customer: "",
  customer_name: "",
  total_allocated_hours: 0,
  hours_allocated_per_day: 0,
  allocation_start_date: "",
  allocation_end_date: "",
  note: "",
  name: "",
};

const ResourceTeamSlice = createSlice({
  name: "resource_allocation_form",
  initialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDialog: (state, action: PayloadAction<boolean>) => {
      state.isShowDialog = action.payload;
    },
    setResourceFormData: (
      state,
      action: PayloadAction<AllocationDataProps>
    ) => {
      Object.assign(state, action.payload);
    },
    resetState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const { setDialog, setResourceFormData, resetState } =
  ResourceTeamSlice.actions;
export default ResourceTeamSlice.reducer;
