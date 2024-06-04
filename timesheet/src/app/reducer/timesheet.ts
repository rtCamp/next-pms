import { getTodayDate } from "@/app/lib/utils";
export interface TimesheetStateProps {
    timesheet: {
        name: string;
        parent: string;
        task: string;
        date: string;
        description: string;
        hours: number;
        isUpdate: boolean;
    },
    dateRange: { start_date: string; end_date: string };
    isFetching: boolean;
    isFetchAgain: boolean;
    data: object;
    isDialogOpen: boolean;
    isAprrovalDialogOpen: boolean;
    weekDate: string;
}

export const getInitialState = {
    timesheet: {
        name: "",
        parent: "",
        task: "",
        date: "",
        description: "",
        hours: 0,
        isUpdate: false,
    },
    dateRange: { start_date: "", end_date: "" },
    isFetching: false,
    isFetchAgain: false,
    data: {},
    isDialogOpen: false,
    isAprrovalDialogOpen: false,
    weekDate: getTodayDate()
}


export const reducer = (state: TimesheetStateProps, { type, payload }: { type: string, payload: any }) => {
    const mappedAction = actionMap.get(type);
    return mappedAction ? mappedAction(state, payload) : state;
};


const actionMap = new Map([

    ["SetDialog", (state: TimesheetStateProps, payload: any) => ({
        ...state,
        isDialogOpen: payload,
    })],
    ["SetApprovalDialog", (state: TimesheetStateProps, payload: any) => ({
        ...state,
        isAprrovalDialogOpen: payload,
    })],
    ["SetData", (state: TimesheetStateProps, payload: any) => ({
        ...state,
        data: payload,
    })],
    ["SetFetching", (state: TimesheetStateProps, payload: any) => ({
        ...state,
        isFetching: payload,
    })],
    ["SetFetchAgain", (state: TimesheetStateProps, payload: any) => ({
        ...state,
        isFetchAgain: payload,
    })],
    ["SetDateRange", (state: TimesheetStateProps, payload: any) => ({
        ...state,
        dateRange: payload,
    })],
    ["SetTimesheet", (state: TimesheetStateProps, payload: any) => ({
        ...state,
        timesheet: payload,
    })],
    ["SetWeekDate", (state: TimesheetStateProps, payload: any) => ({
        ...state,
        weekDate: payload,
    })],
    ["AppendData", (state: TimesheetStateProps, payload: any) => ({
        ...state,
        data: Object.assign(state.data, payload),
    })],

]);
