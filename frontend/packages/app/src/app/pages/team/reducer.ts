/**
 * External dependencies
 */
import { getTodayDate, getFormatedDate } from "@next-pms/design-system/date";
import { addDays } from "date-fns";

/**
 * Internal dependencies
 */
import { DataProp as timesheetDataProps } from "@/types/timesheet";

type DateRange = {
  start_date: string;
  end_date: string;
};

export type teamStateActionType = "SET" | "UPDATE";

export interface TeamState {
  data: dataProps;
  action: teamStateActionType;
  statusFilter: Array<string>;
  status: Array<string>;
  employeeName?: string;
  isDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
  weekDate: string;
  employeeWeekDate: string;
  project: Array<string>;
  userGroup: Array<string>;
  pageLength: number;
  reportsTo: string;
  timesheet: {
    name: string;
    parent: string;
    task: string;
    date: string;
    description: string;
    hours: number;
    project?: string;
  };
  timesheetData: timesheetDataProps;
  start: number;
  dateRange: DateRange;
  employee: string;
  hasMore: boolean;
  isLoading: boolean;
  isNeedToFetchDataAfterUpdate: boolean;
}

export interface dataProps {
  data: any;
  dates: DateProps[];
  total_count: number;
  has_more: boolean;
}

export type DateProps = {
  start_date: string;
  end_date: string;
  key: string;
  dates: string[];
};

export const initialState: TeamState = {
  action: "SET",
  timesheet: {
    name: "",
    parent: "",
    task: "",
    date: "",
    description: "",
    hours: 0,
    project: "",
  },
  employee: "",
  employeeName: "",
  reportsTo: "",
  status: ["Active"],
  isEditDialogOpen: false,
  pageLength: 20,
  data: {
    data: {},
    dates: [],
    total_count: 0,
    has_more: false,
  },
  isDialogOpen: false,
  isAprrovalDialogOpen: false,
  weekDate: getFormatedDate(addDays(getTodayDate(), -7)),
  employeeWeekDate: getFormatedDate(getTodayDate()),
  project: [],
  userGroup: [],
  statusFilter: [],
  start: 0,
  hasMore: true,
  dateRange: {
    start_date: "",
    end_date: "",
  },
  timesheetData: {
    working_hour: 0,
    working_frequency: "Per Day",
    data: {},
    leaves: [],
    holidays: [],
  },
  isLoading: true,
  isNeedToFetchDataAfterUpdate: false,
};

// Define action types
export type Action =
  | { type: "setData"; payload: any }
  | { type: "setReFetchData"; payload: boolean }
  | { type: "setEmployeeName"; payload: string }
  | { type: "setStatusFilter"; payload: Array<string> }
  | { type: "updateData"; payload: any }
  | { type: "setTimesheet"; payload: any }
  | { type: "setWeekDate"; payload: string }
  | { type: "setEmployeeWeekDate"; payload: string }
  | { type: "setProject"; payload: Array<string> }
  | { type: "setStart"; payload: number }
  | { type: "setHasMore"; payload: boolean }
  | {
      type: "setDateRange";
      payload: { dateRange: DateRange; isAprrovalDialogOpen: boolean };
    }
  | { type: "setApprovalDialog"; payload: boolean }
  | { type: "setEditDialog"; payload: boolean }
  | { type: "setEmployee"; payload: string }
  | { type: "setDialog"; payload: boolean }
  | { type: "resetState" }
  | { type: "resetTimesheetDataState" }
  | { type: "setTimesheetData"; payload: timesheetDataProps }
  | { type: "updateTimesheetData"; payload: timesheetDataProps }
  | { type: "setUsergroup"; payload: Array<string> }
  | { type: "setReportsTo"; payload: string }
  | { type: "setStatus"; payload: Array<string> }
  | { type: "setAction"; payload: teamStateActionType }
  | {
      type: "setFilters";
      payload: {
        project: Array<string>;
        userGroup: Array<string>;
        statusFilter: Array<string>;
        employeeName: string;
        reportsTo: string;
        status: Array<string>;
      };
    };

const actionHandlers = {
  setData: (state: TeamState, payload: any) => ({
    ...state,
    data: payload,
    hasMore: payload.has_more,
    pageLength: initialState.pageLength,
    isLoading: false,
  }),
  setAction: (state: TeamState,payload:teamStateActionType) => ({
    ...state,
    action:payload
  }),
  setReFetchData: (state: TeamState, payload: boolean) => ({
    ...state,
    isNeedToFetchDataAfterUpdate: payload,
  }),
  setEmployeeName: (state: TeamState, payload: string) => ({
    ...state,
    employeeName: payload,
    action: "SET",
    start: 0,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
    pageLength: initialState.pageLength,
  }),
  setStatusFilter: (state: TeamState, payload: Array<string>) => ({
    ...state,
    statusFilter: payload,
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
    action: "SET",
  }),
  updateData: (state: TeamState, payload: any) => ({
    ...state,
    data: {
      ...state.data,
      data: { ...state.data.data, ...payload.data },
      dates: payload.dates,
      total_count: payload.total_count,
    },
    hasMore: payload.has_more,
    isLoading: false,
  }),
  setTimesheet: (state: TeamState, payload: any) => ({
    ...state,
    timesheet: payload.timesheet,
    employee: payload.id,
  }),
  setWeekDate: (state: TeamState, payload: string) => ({
    ...state,
    weekDate: payload,
    start: 0,
    pageLength: initialState.pageLength,
    action: "SET",
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  setEmployeeWeekDate: (state: TeamState, payload: string) => ({
    ...state,
    employeeWeekDate: payload,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  setProject: (state: TeamState, payload: Array<string>) => ({
    ...state,
    project: payload,
    action: "SET",
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  setStart: (state: TeamState, payload: number) => ({
    ...state,
    start: payload,
    pageLength: initialState.pageLength,
    action: "UPDATE",
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  setHasMore: (state: TeamState, payload: boolean) => ({
    ...state,
    hasMore: payload,
  }),
  setDateRange: (
    state: TeamState,
    payload: {
      dateRange: DateRange;
      isAprrovalDialogOpen: boolean;
    }
  ) => ({
    ...state,
    dateRange: payload.dateRange,
    isAprrovalDialogOpen: payload.isAprrovalDialogOpen,
  }),
  setApprovalDialog: (state: TeamState, payload: boolean) => ({
    ...state,
    isAprrovalDialogOpen: payload,
  }),
  setEditDialog: (state: TeamState, payload: boolean) => ({
    ...state,
    isEditDialogOpen: payload,
  }),
  setEmployee: (state: TeamState, payload: string) => ({
    ...state,
    employee: payload,
  }),
  setDialog: (state: TeamState, payload: boolean) => ({
    ...state,
    isDialogOpen: payload,
  }),
  resetState: () => initialState,
  resetTimesheetDataState: (state: TeamState) => ({
    ...state,
    timesheetData: initialState.timesheetData,
  }),
  setTimesheetData: (state: TeamState, payload: timesheetDataProps) => ({
    ...state,
    timesheetData: payload,
  }),
  updateTimesheetData: (state: TeamState, payload: timesheetDataProps) => {
    const updatedLeaves = payload.leaves.filter(
      (leave) =>
        !new Set(state.timesheetData.leaves.map((leave) => leave.name)).has(
          leave.name
        )
    );

    return {
      ...state,
      timesheetData: {
        ...state.timesheetData,
        data: { ...state.timesheetData.data, ...payload.data },
        working_hour: payload.working_hour,
        working_frequency: payload.working_frequency,
        holidays: [...state.timesheetData.holidays, ...payload.holidays],
        leaves: [...state.timesheetData.leaves, ...updatedLeaves],
      },
    };
  },
  setUsergroup: (state: TeamState, payload: Array<string>) => ({
    ...state,
    userGroup: payload,
    action: "SET",
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  setReportsTo: (state: TeamState, payload: string) => ({
    ...state,
    reportsTo: payload,
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  setStatus: (state: TeamState, payload: Array<string>) => ({
    ...state,
    status: payload,
    action: "SET",
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  setFilters: (
    state: TeamState,
    payload: {
      project: Array<string>;
      userGroup: Array<string>;
      statusFilter: Array<string>;
      employeeName: string;
      reportsTo: string;
      status: Array<string>;
    }
  ) => ({
    ...state,
    project: payload.project,
    userGroup: payload.userGroup,
    statusFilter: payload.statusFilter,
    status: payload.status,
    employeeName: payload.employeeName,
    reportsTo: payload.reportsTo,
    pageLength: initialState.pageLength,
    start: 0,
    action: "SET",
    isNeedToFetchDataAfterUpdate: true,
  }),
};

export const reducer = (state: TeamState, action: Action): TeamState => {
  const handler = actionHandlers[action.type];
  if (handler) {
    return handler(state, action.payload as never) as TeamState;
  }
  return state;
};
