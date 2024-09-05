import { checkScreenSize } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type TScreenSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface AppState {
  screenSize: TScreenSize;
  //   add other app related states.
}

export const initialState: AppState = {
  screenSize: checkScreenSize(),
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    // add app related reducers
    updateScreenSize: (state, action: PayloadAction<TScreenSize>) => {
      state.screenSize = action.payload;
    },
  },
});

export const { updateScreenSize } = appSlice.actions;
export default appSlice.reducer;
