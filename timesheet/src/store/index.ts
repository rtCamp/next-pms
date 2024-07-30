import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user';
import timesheetReducer from './timesheet';
import teamReducer from './team';

export const store = configureStore({
    reducer: {
        user: userReducer,
        timesheet: timesheetReducer,
        team: teamReducer,
    }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
