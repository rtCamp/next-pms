import { configureStore } from '@reduxjs/toolkit';
import userReducer from './user';
import timesheetReducer from './timesheet';
import homeReducer from './home';
import teamReducer from './team';
export const store = configureStore({
    reducer: {
        user: userReducer,
        timesheet: timesheetReducer,
        home: homeReducer,
        team: teamReducer,
    }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
