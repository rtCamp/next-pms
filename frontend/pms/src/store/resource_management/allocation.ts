import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { getTodayDate, getFormatedDate } from "@/lib/utils";

export type AllocationDataProps = {
  isShowDialog: boolean;
  employee: string;
  is_billable: boolean;
  project: string;
  customer: string;
  total_allocated_hours: number;
  hours_allocated_per_day: number;
  allocation_start_date: string;
  allocation_end_date: string;
};

const initialState = {
  isShowDialog: true,
  employee: "",
  is_billable: "",
  project: "",
  customer: "",
  total_allocated_hours: 0,
  hours_allocated_per_day: 0,
  allocation_start_date: getFormatedDate(getTodayDate()),
  allocation_end_date: getFormatedDate(getTodayDate()),
  note:""
};

const ResourceTeamSlice = createSlice({
  name: "resource_allocation_form",
  initialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setDialog: (state, action: PayloadAction<boolean>) => {
      state.isShowDialog = action.payload;
    },
  },
});

export const { setDialog } = ResourceTeamSlice.actions;
export default ResourceTeamSlice.reducer;
