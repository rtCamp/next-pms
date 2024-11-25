import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./user";
import timesheetReducer from "./timesheet";
import teamReducer from "./team";
import homeReducer from "./home";
import appReducer from "./app";
import taskReducer from "./task";
import projectReducer from "./project";
import viewReducer from "./view";
import resourceTeamReducer from "./resource_management/team";
import resourceProjectReducer from "./resource_management/project";

export const store = configureStore({
  reducer: {
    user: userReducer,
    timesheet: timesheetReducer,
    resource_team: resourceTeamReducer,
    resource_project: resourceProjectReducer,
    team: teamReducer,
    home: homeReducer,
    app: appReducer,
    task: taskReducer,
    project: projectReducer,
    view: viewReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
