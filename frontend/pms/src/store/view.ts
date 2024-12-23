/**
 * External dependencies.
 */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface ViewState {
    views: Array<ViewData>
}

export interface ViewData {
    name?: string,
    dt: string,
    label: string,
    filters: any,
    columns: any,
    rows: string[],
    user: string,
    default: boolean,
    public: boolean,
    route: string
    order_by: { field: string, order: string },
    owner?: string
    icon:string
}

const initialState: ViewState = {
    views: window.frappe?.boot?.views ?? []
}

const viewSlice = createSlice({
    name: "view",
    initialState,

    reducers: {
        setViews: (state, action: PayloadAction<ViewData[]>) => {
            action.payload.forEach(view => {
                if (typeof view.filters == 'string') {
                    view.filters = JSON.parse(view.filters);
                }
                if (typeof view.rows == 'string') {
                    view.rows = JSON.parse(view.rows);
                }
                if (typeof view.order_by == 'string') {
                    view.order_by = JSON.parse(view.order_by);
                }
                if (typeof view.columns == 'string') {
                    view.columns = JSON.parse(view.columns);
                }
            });
            state.views = action.payload
        },
        addView: (state, action: PayloadAction<ViewData>) => {
            if (typeof action.payload.filters == 'string') {
                action.payload.filters = JSON.parse(action.payload.filters);
            }
            if (typeof action.payload.rows == 'string') {
                action.payload.rows = JSON.parse(action.payload.rows);
            }
            if (typeof action.payload.columns == 'string') {
                action.payload.columns = JSON.parse(action.payload.columns);
            }
            if (typeof action.payload.order_by == 'string') {
                action.payload.order_by = JSON.parse(action.payload.order_by);
            }
            state.views.push(action.payload)
        },
        removeView: (state, action: PayloadAction<string>) => {
            state.views = state.views.filter(v => v.name !== action.payload)
        },
        updateView: (state, action: PayloadAction<ViewData>) => {
            const index = state.views.findIndex(v => v.name === action.payload.name)
            state.views[index] = action.payload
        }
    }
});

export const { setViews, addView, removeView, updateView } = viewSlice.actions;

export default viewSlice.reducer;