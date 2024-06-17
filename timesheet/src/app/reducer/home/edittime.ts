import { getFormatedDate } from "@/app/lib/utils";
export interface EditTimeProps {
    isEmployeeBoxOpen: boolean;
    isDatePickerOpen: boolean;
    selectedDate: string;
    isOpen: boolean;
    dialogInput: DialogInput;
}
interface DialogInput {
    employee: string
    task: string
    hours: string
    description: string
    date: string
    is_update: boolean
}
export const initialState: EditTimeProps = {
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
    selectedDate: getFormatedDate(new Date()),
    isOpen: false
}

export const reducer = (state: EditTimeProps, { type, payload }: { type: string, payload: any }) => {
    const mappedAction = actionMap.get(type);
    return mappedAction ? mappedAction(state, payload) : state;
}
 
const actionMap = new Map([
    ["setIsOpen", (state: EditTimeProps, payload: any) => ({
        ...state,
        isOpen: payload,
    })],
    ["setSelectedDate", (state: EditTimeProps, payload: any) => ({
        ...state,
        selectedDate: payload,
    })],
    ["setIsEmployeeBoxOpen", (state: EditTimeProps, payload: any) => ({
        ...state,
        isEmployeeBoxOpen: payload,
    })],
    ["setDialogInput", (state: EditTimeProps, payload: DialogInput) => ({
        ...state,
        dialogInput: payload,
    })],
    ["setIsDatePickerOpen", (state: EditTimeProps, payload: any) => ({
        ...state,
        isDatePickerOpen: payload,
    })],
]);
