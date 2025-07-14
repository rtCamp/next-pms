/**
 * External dependencies.
 */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface ViewState {
  views: Array<ViewData>;
}

export interface ViewData {
  name?: string;
  dt: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: any;
  rows: string[];
  user: string;
  default: boolean;
  public: boolean;
  route: string;
  order_by: { field: string; order: string };
  owner?: string;
  icon: string;
  pinnedColumns?: string[];
}

const initialState: ViewState = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  views: (window as any)?.frappe?.boot?.views ?? [],
};

const viewSlice = createSlice({
  name: "view",
  initialState,

  reducers: {
    setViews: (state, action: PayloadAction<ViewData[]>) => {
      action.payload.forEach((view) => {
        if (typeof view.filters == "string") {
          view.filters = JSON.parse(view.filters);
        }
        if (typeof view.rows == "string") {
          view.rows = JSON.parse(view.rows);
        }
        if (typeof view.order_by == "string") {
          view.order_by = JSON.parse(view.order_by);
        }
        if (typeof view.columns == "string") {
          view.columns = JSON.parse(view.columns);
        }
        if (typeof view.pinnedColumns == "string") {
          view.pinnedColumns = JSON.parse(view.pinnedColumns);
        }
        if (!view.pinnedColumns || view.pinnedColumns.length === 0) {
          view.pinnedColumns = [];
        }
      });
      state.views = action.payload;
    },
    addView: (state, action: PayloadAction<ViewData>) => {
      if (typeof action.payload.filters == "string") {
        action.payload.filters = JSON.parse(action.payload.filters);
      }
      if (typeof action.payload.rows == "string") {
        action.payload.rows = JSON.parse(action.payload.rows);
      }
      if (typeof action.payload.columns == "string") {
        action.payload.columns = JSON.parse(action.payload.columns);
      }
      if (typeof action.payload.order_by == "string") {
        action.payload.order_by = JSON.parse(action.payload.order_by);
      }
      if (typeof action.payload.pinnedColumns == "string") {
        action.payload.pinnedColumns = JSON.parse(action.payload.pinnedColumns);
      }
      if (
        !action.payload.pinnedColumns ||
        action.payload.pinnedColumns.length === 0
      ) {
        action.payload.pinnedColumns = [];
      }
      state.views.push(action.payload);
    },
    removeView: (state, action: PayloadAction<string>) => {
      state.views = state.views.filter((v) => v.name !== action.payload);
    },
    updateView: (state, action: PayloadAction<ViewData>) => {
      const index = state.views.findIndex(
        (v) => v.name === action.payload.name
      );
      const updatedView = action.payload;
      if (typeof action.payload.filters == "string") {
        updatedView.filters = JSON.parse(action.payload.filters);
      }
      if (typeof action.payload.rows == "string") {
        updatedView.rows = JSON.parse(action.payload.rows);
      }
      if (typeof action.payload.columns == "string") {
        updatedView.columns = JSON.parse(action.payload.columns);
      }
      if (typeof action.payload.order_by == "string") {
        updatedView.order_by = JSON.parse(action.payload.order_by);
      }
      if (typeof action.payload.pinnedColumns == "string") {
        updatedView.pinnedColumns = JSON.parse(action.payload.pinnedColumns);
      }
      if (
        !updatedView.pinnedColumns ||
        updatedView.pinnedColumns.length === 0
      ) {
        updatedView.pinnedColumns = [];
      }
      state.views[index] = updatedView;
    },
  },
});

export const { setViews, addView, removeView, updateView } = viewSlice.actions;

export default viewSlice.reducer;
