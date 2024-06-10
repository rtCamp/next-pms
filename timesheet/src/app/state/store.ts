import { configureStore } from '@reduxjs/toolkit';
import employeeReducer from "./employee"
import roleReducer from "./roles"
export const store = configureStore({
    reducer: {
        employee: employeeReducer,
        roles   : roleReducer

    }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
