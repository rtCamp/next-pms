import { configureStore } from '@reduxjs/toolkit';
import employeeReducer from "./employee"
import projectReducer from "./project"
import departmentReducer from "./department"
import roleReducer from "./roles"
import employeeListReducer from "./employeeList"
import teamReducer from "./team"
export const store = configureStore({
    reducer: {
        employee: employeeReducer,
        roles: roleReducer,
        projects: projectReducer,
        departments: departmentReducer,
        employeeList: employeeListReducer,
        team: teamReducer

    }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
