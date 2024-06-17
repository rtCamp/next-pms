import { Task } from "@/app/types/type";
import { getFormatedDate } from "@/app/lib/utils";
export interface AddTimeProps {
    isEmployeeBoxOpen: boolean;
    isDatePickerOpen: boolean;
    isTaskBoxOpen: boolean;
    taskSearch: string;
    filterTask: Array<Task>;
    selectedDate: string;
    isOpen: boolean;

}


export const initialState: AddTimeProps = {

    isEmployeeBoxOpen: false,
    isDatePickerOpen: false,
    isTaskBoxOpen: false,
    taskSearch: "",
    filterTask: [],
    selectedDate: getFormatedDate(new Date()),
    isOpen: false
};

export const reducer = (state: AddTimeProps, { type, payload }: { type: string, payload: any }) => {
    const mappedAction = actionMap.get(type);
    return mappedAction ? mappedAction(state, payload) : state;
};

const actionMap = new Map([
    ["setIsOpen", (state: AddTimeProps, payload: any) => ({
        ...state,
        isOpen: payload,
    })],
    ["setIsEmployeeBoxOpen", (state: AddTimeProps, payload: any) => ({
        ...state,
        isEmployeeBoxOpen: payload,
    })],
    ["setIsDatePickerOpen", (state: AddTimeProps, payload: any) => ({
        ...state,
        isDatePickerOpen: payload,
    })],
    ["setIsTaskBoxOpen", (state: AddTimeProps, payload: any) => ({
        ...state,
        isTaskBoxOpen: payload,
    })],
    ["setTaskSearch", (state: AddTimeProps, payload: any) => ({
        ...state,
        taskSearch: payload,
    })],
    ["setFilterTask", (state: AddTimeProps, payload: any) => ({
        ...state,
        filterTask: payload,
    })],
    ["setSelectedDate", (state: AddTimeProps, payload: any) => ({
        ...state,
        selectedDate: payload,
    })],
]);
