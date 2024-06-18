import {Task} from "@/app/types/type";
import { getFormatedDate } from "@/app/lib/utils";
export interface AddTimeProps {
    dialogInput: DialogInput;
    isEmployeeBoxOpen: boolean;
    isDatePickerOpen: boolean;
    isTaskBoxOpen: boolean;
    taskSearch: string;
    selectedDate: string;
    isOpen: boolean;

}
interface DialogInput {
    employee: string
    task: string
    hours: string
    description: string
    date: string
    is_update: boolean
}

export const initialState: AddTimeProps = {
    dialogInput: {
        employee: "",
        task: "",
        hours: "",
        description: "",
        date: "",
        is_update: false

    },
    isEmployeeBoxOpen: false,
    isDatePickerOpen: false,
    isTaskBoxOpen: false,
    taskSearch: "",

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
    ["setSelectedDate", (state: AddTimeProps, payload: any) => ({
        ...state,
        selectedDate: payload,
    })],
    ["setDialogInput", (state: AddTimeProps, payload: DialogInput) => ({
        ...state,
        dialogInput: payload,
    })],

]);
