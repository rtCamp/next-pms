import { checkScreenSize } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type TScreenSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface AppState {
  screenSize: TScreenSize;
  currencies:Array<string>
}

export const initialState: AppState = {
  screenSize: checkScreenSize(),
  currencies: window.frappe?.boot?.currencies ?? [],
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    // add app related reducers
    updateScreenSize: (state, action: PayloadAction<TScreenSize>) => {
      state.screenSize = action.payload;
    },
    setCurrency: (state, action: PayloadAction<Array<string>>) => {
      state.currencies = action.payload;
    }
  },
});

export const { updateScreenSize, setCurrency } = appSlice.actions;
export default appSlice.reducer;
