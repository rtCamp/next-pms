import { getFormatedStringValue } from "@/app/pages/resource_management/utils/value";
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
      state.isShowDialog = action.payload.isShowDialog;
      state.isNeedToEdit = action.payload.isNeedToEdit;
      state.employee = getFormatedStringValue(
        action.payload.employee
      ) as string;
      state.is_billable = action.payload.is_billable;
      state.project = getFormatedStringValue(action.payload.project) as string;
      state.project_name = getFormatedStringValue(
        action.payload.project_name
      ) as string;
      state.customer = getFormatedStringValue(
        action.payload.customer
      ) as string;
      state.customer_name = getFormatedStringValue(
        action.payload.customer_name
      ) as string;
      state.total_allocated_hours = action.payload.total_allocated_hours;
      state.hours_allocated_per_day = action.payload
        .hours_allocated_per_day as number;
      state.allocation_start_date = getFormatedStringValue(
        action.payload.allocation_start_date
      ) as string;
      state.allocation_end_date = getFormatedStringValue(
        action.payload.allocation_end_date
      ) as string;
      state.note = action.payload.note;
      state.name = getFormatedStringValue(action.payload.name) as string;
    },
    resetState: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const { setDialog, setResourceFormData, resetState } =
  ResourceTeamSlice.actions;
export default ResourceTeamSlice.reducer;
