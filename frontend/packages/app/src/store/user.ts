/**
 * External dependencies.
 */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */
import { getCookie } from "@/lib/utils";
import { WorkingFrequency } from "@/types";

const userImage = getCookie("user_image");
const fullName = getCookie("full_name");
const user = getCookie("user_id");

interface InitiDataProps {
  employee: string;
  workingHours: number;
  workingFrequency: WorkingFrequency;
  reportsTo: string;
  employeeName: string;
}

export interface UserState {
  userName: string;
  image: string;
  roles: string[];
  isSidebarCollapsed: boolean;
  employee: string;
  user: string;
  workingHours: number;
  workingFrequency: WorkingFrequency;
  reportsTo: string;
  employeeName: string;
  currencies: Array<string>;
}

const initialState: UserState = {
  // @ts-expect-error - frappe is global object provided by frappe
  roles: window.frappe?.boot?.user?.roles ?? [],
  userName: decodeURIComponent(fullName as string) ?? "",
  image: userImage ?? "",
  isSidebarCollapsed: false,
  employee: "",
  employeeName: "",
  user: decodeURIComponent(user ?? ""),
  workingHours: 0,
  workingFrequency: "Per Day",
  reportsTo: "",
  // @ts-expect-error - frappe is global object provided by frappe
  currencies: window.frappe?.boot?.currencies ?? [],
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setRole: (state, action: PayloadAction<Array<string>>) => {
      state.roles = action.payload;
    },
    setUserName: (state, action: PayloadAction<string>) => {
      state.userName = action.payload;
    },
    setImage: (state, action: PayloadAction<string>) => {
      state.image = action.payload;
    },
    setReportsTo: (state, action: PayloadAction<string>) => {
      state.reportsTo = action.payload;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    setEmployee: (state, action: PayloadAction<string>) => {
      state.employee = action.payload;
    },
    setCurrency: (state, action: PayloadAction<Array<string>>) => {
      state.currencies = action.payload;
    },
    setWorkingDetail: (
      state,
      action: PayloadAction<{
        workingHours: number;
        workingFrequency: WorkingFrequency;
      }>
    ) => {
      state.workingHours = action.payload.workingHours;
      state.workingFrequency = action.payload.workingFrequency;
    },
    setInitialData: (state, action: PayloadAction<InitiDataProps>) => {
      state.employee = action.payload.employee;
      state.workingHours = action.payload.workingHours;
      state.workingFrequency = action.payload.workingFrequency;
      state.reportsTo = action.payload.reportsTo;
      state.employeeName = action.payload.employeeName;
    },
  },
});

export const {
  setRole,
  setImage,
  setUserName,
  setSidebarCollapsed,
  setEmployee,
  setWorkingDetail,
  setInitialData,
  setCurrency,
} = userSlice.actions;

export default userSlice.reducer;
