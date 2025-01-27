/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Internal dependencies
 */
import { getTodayDate } from "@next-pms/design-system/date";

interface dataProps {
    data: any;
    dates: DateProps[];
    totalCount: number;
    hasMore: boolean;
}

export type DateProps = {
    startDate: string;
    endDate: string;
    key: string;
    dates: string[];
};
export type PayloadDateProps = {
    start_date: string;
    end_date: string;
    key: string;
    dates: string[];
};
export type HomeState = {
    data: dataProps;
    action: "SET" | "UPDATE";
    isDialogOpen: boolean;
    isAprrovalDialogOpen: boolean;
    employeeName: string;
    status: Array<string>;
    weekDate: string;
    pageLength: number;
    timesheet: {
        name: string;
        parent: string;
        task: string;
        date: string;
        description: string;
        hours: number;
        isUpdate: boolean;
        employee?: string;
    };
    start: number;
    isLoading: boolean;
    isNeedToFetchDataAfterUpdate: boolean;
}

export const initialState: HomeState = {
    action: "SET",
    timesheet: {
        name: "",
        parent: "",
        task: "",
        date: "",
        description: "",
        hours: 0,
        isUpdate: false,
        employee: "",
    },
    isLoading: true,

    status: ["Active"],
    data: {
        data: [],
        dates: [],
        totalCount: 0,
        hasMore: false,
    },
    pageLength: 20,
    isDialogOpen: false,
    isNeedToFetchDataAfterUpdate: false,
    isAprrovalDialogOpen: false,
    employeeName: "",
    weekDate: getTodayDate(),
    start: 0,
};

export type Action =
    | { type: "SET_DATA"; payload: { data: any; dates: PayloadDateProps[]; total_count: number; has_more: boolean } }
    | { type: "SET_REFETCH_DATA"; payload: boolean }
    | { type: "SET_TIMESHEET"; payload: HomeState["timesheet"] }
    | { type: "SET_WEEK_DATE"; payload: string }
    | { type: "SET_FILTERS"; payload: { employeeName: string; status: Array<string> } }
    | { type: "SET_STATUS"; payload: Array<string> }
    | { type: "SET_EMPLOYEE_NAME"; payload: string }
    | { type: "SET_START"; payload: number }
    | { type: "UPDATE_DATA"; payload: { data: any; dates: PayloadDateProps[]; total_count: number; has_more: boolean } };

const actionHandlers: {
    [K in Action["type"]]: (state: HomeState, action: Extract<Action, { type: K }>) => HomeState;
} = {
    SET_DATA: (state, action) => ({
        ...state,
        data: {
            ...state.data,
            hasMore: action.payload.has_more,
            data: { ...action.payload.data },
            dates: action.payload.dates.map(date => ({ ...date, startDate: date.start_date, endDate: date.end_date })),
            totalCount: action.payload.total_count,
        },
        isLoading: false,
    }),
    SET_REFETCH_DATA: (state, action) => ({
        ...state,
        isNeedToFetchDataAfterUpdate: action.payload,
    }),
    SET_TIMESHEET: (state, action) => ({
        ...state,
        timesheet: action.payload,
    }),
    SET_WEEK_DATE: (state, action) => ({
        ...state,
        weekDate: action.payload,
        pageLength: initialState.pageLength,
        action: "SET",
        isLoading: true,
        isNeedToFetchDataAfterUpdate: true,
        start: 0,
    }),
    SET_FILTERS: (state, action) => ({
        ...state,
        employeeName: action.payload.employeeName,
        action: "SET",
        status: action.payload.status,
        start: 0,
        isLoading: true,
        isNeedToFetchDataAfterUpdate: true,
        pageLength: initialState.pageLength,
    }),
    SET_STATUS: (state, action) => ({
        ...state,
        status: action.payload,
        action: "SET",
        start: 0,
        isLoading: true,
        isNeedToFetchDataAfterUpdate: true,
        pageLength: initialState.pageLength,
    }),
    SET_EMPLOYEE_NAME: (state, action) => ({
        ...state,
        employeeName: action.payload,
        action: "SET",
        start: 0,
        isLoading: true,
        isNeedToFetchDataAfterUpdate: true,
        pageLength: initialState.pageLength,
    }),
    SET_START: (state, action) => ({
        ...state,
        start: action.payload,
        action: "UPDATE",
        isLoading: true,
        isNeedToFetchDataAfterUpdate: true,
        pageLength: initialState.pageLength,
    }),
    UPDATE_DATA: (state, action) => ({
        ...state,
        data: {
            ...state.data,
            hasMore: action.payload.has_more,
            data: { ...state.data.data, ...action.payload.data },
            dates: action.payload.dates.map(date => ({ ...date, startDate: date.start_date, endDate: date.end_date })),
            totalCount: action.payload.total_count,
        },
        isLoading: false,
    }),
};


export const homeReducer = (state: HomeState, action: Action): HomeState => {
    const handler = actionHandlers[action.type];
    return handler ? handler(state, action) : state;
}