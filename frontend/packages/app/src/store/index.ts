/* eslint-disable import/order */
/**
 * External dependencies.
 */
import { configureStore } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */

import projectReducer from "./project";
import userReducer from "./user";
import viewReducer from "./view";
import resourceProjectReducer from "./resource_management/project";

export const store = configureStore({
  reducer: {
    user: userReducer,
    resource_project: resourceProjectReducer,
    project: projectReducer,
    view: viewReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
