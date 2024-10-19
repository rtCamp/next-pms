import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { getCookie } from "@/lib/utils";
import { WorkingFrequency } from "@/types";
const userImage = getCookie("user_image");
const fullName = getCookie("full_name");
const user = getCookie("user_id");

export interface UserState {
  userName: string;
  image: string;
  roles: string[];
  isSidebarCollapsed: boolean;
  employee: string;
  user: string;
  workingHours: number;
  workingFrequency: WorkingFrequency;
}

const initialState: UserState = {
  //@ts-ignore
  roles: window.frappe?.boot?.user?.roles ?? [],
  userName: decodeURIComponent(fullName as string) ?? "",
  image: userImage ?? "",
  isSidebarCollapsed: false,
  employee: "",
  //@ts-ignore
  user: decodeURIComponent(user),
  workingHours: 0,
  workingFrequency: "Per Day",
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

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload;
    },
    setEmployee: (state, action: PayloadAction<string>) => {
      state.employee = action.payload;
    },
    setWorkingDetail: (
      state,
      action: PayloadAction<{
        workingHours: number;
        workingFrequency: WorkingFrequency;
      }>,
    ) => {
      state.workingHours = action.payload.workingHours;
      state.workingFrequency = action.payload.workingFrequency;
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
} = userSlice.actions;
export default userSlice.reducer;
