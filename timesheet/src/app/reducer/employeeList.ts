import { getTodayDate } from "@/app/lib/utils";
export interface EmployeeStateProps {
    isFetching: boolean;
    weekDate: string;
    selectedDepartment: Array<string>;
    selectedProject: Array<string>;
    prevHeading: string;
    curentHeading: string;
    employeeName: string;
}


export const getInitialState = {
    isFetching: false,
    weekDate: getTodayDate(),
    selectedDepartment: [],
    selectedProject: [],
    prevHeading: "",
    curentHeading: "",
    employeeName: "",
}
export const reducer = (state: EmployeeStateProps, { type, payload }: { type: string, payload: any }) => {
    const mappedAction = actionMap.get(type);
    return mappedAction ? mappedAction(state, payload) : state;
};

const actionMap = new Map([

    ["SetWeekDate", (state: EmployeeStateProps, payload: any) => ({
        ...state,
        weekDate: payload,
    })],
    ["SetFetching", (state: EmployeeStateProps, payload: any) => ({
        ...state,
        isFetching: payload,
    })],
    ["SetEmployeeName", (state: EmployeeStateProps, payload: any) => ({
        ...state,
        employeeName: payload,
    })],
    ["SetHeading", (state: EmployeeStateProps, payload: any) => ({
        ...state,
        curentHeading: payload.curentHeading,
        prevHeading: payload.prevHeading,
    })],
    ["SetDepartment", (state: EmployeeStateProps, payload: any) => ({
        ...state,
        selectedDepartment: payload,
    })],
    ["SetProject", (state: EmployeeStateProps, payload: any) => ({
        ...state,
        selectedProject: payload,
    })],

]);
