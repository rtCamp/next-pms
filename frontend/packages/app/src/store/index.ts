/**
 * External dependencies.
 */
import { configureStore } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */

import projectReducer from "./project";

export const store = configureStore({
  reducer: {
    project: projectReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
