import { configureStore } from '@reduxjs/toolkit';
import employeeReducer from "./employee"
import projectReducer from "./project"
import departmentReducer from "./department"
import roleReducer from "./roles"
export const store = configureStore({
    reducer: {
        employee: employeeReducer,
        roles: roleReducer,
        projects: projectReducer,
        departments: departmentReducer

    }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
