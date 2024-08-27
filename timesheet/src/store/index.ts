import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user';
import timesheetReducer from './timesheet';
import teamReducer from './team';
import homeReducer from './home';
import appReducer from './app';
import taskReducer from './task';

export const store = configureStore({
    reducer: {
        user: userReducer,
        timesheet: timesheetReducer,
        team: teamReducer,
        home: homeReducer,
        app: appReducer,
        task: taskReducer,
    }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
