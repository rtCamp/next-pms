import { getFormatedDate } from "@/app/lib/utils";
export interface EditTimeProps {
    isEmployeeBoxOpen: boolean;
    isDatePickerOpen: boolean;
    isOpen: boolean;
    dialogInput: DialogInput;
    data: any;
    isAdd: boolean;
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
        date: getFormatedDate(new Date()),
        is_update: false
    },
    isEmployeeBoxOpen: false,
    isDatePickerOpen: false,
    isOpen: false,
    data: null,
    isAdd: false
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
    ["setIsAdd", (state: EditTimeProps, payload: any) => ({
        ...state,
        isAdd: payload,
    })],
    ["setSelectedDate", (state: EditTimeProps, payload: any) => ({
        ...state,
        dialogInput: { ...state.dialogInput, date: payload },
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
    ["setData", (state: EditTimeProps, payload: any) => ({
        ...state,
        data: payload,
    })],
]);
