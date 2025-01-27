/* eslint-disable import/order */
/**
 * External dependencies.
 */
import { configureStore } from "@reduxjs/toolkit";

/**
 * Internal dependencies.
 */
import appReducer from "./app";
import homeReducer from "./home";
import projectReducer from "./project";
import resourceTeamReducer from "./resource_management/team";
import taskReducer from "./task";
import timesheetReducer from "./timesheet";
import userReducer from "./user";
import viewReducer from "./view";
import resourceProjectReducer from "./resource_management/project";
import resourceAllocationFormReducer from "./resource_management/allocation";


export const store = configureStore({
  reducer: {
    user: userReducer,
    timesheet: timesheetReducer,
    resource_team: resourceTeamReducer,
    resource_project: resourceProjectReducer,
    resource_allocation_form: resourceAllocationFormReducer,
    home: homeReducer,
    app: appReducer,
    task: taskReducer,
    project: projectReducer,
    view: viewReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
