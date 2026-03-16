/**
 * External dependencies.
 */
import { configureStore } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */

import projectReducer from "./project";
import viewReducer from "./view";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    view: viewReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
