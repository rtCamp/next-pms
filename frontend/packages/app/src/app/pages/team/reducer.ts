/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * External dependencies
 */
import { getTodayDate, getFormatedDate } from "@next-pms/design-system/date";
import { addDays } from "date-fns";

/**
 * Internal dependencies
 */
import { DateRange, teamStateActionType } from "@/types/team";
import { DataProp as timesheetDataProps } from "@/types/timesheet";
import type { TeamState } from "./employee-detail/types";

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
    startDate: "",
    endDate: "",
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
  hasViewUpdated: false,
};

const actionHandlers = {
  SET_DATA: (state: TeamState, payload: any) => ({
    ...state,
    data: payload,
    hasMore: payload.has_more,
    pageLength: initialState.pageLength,
    isLoading: false,
  }),
  SET_ACTION: (state: TeamState, payload: teamStateActionType) => ({
    ...state,
    action: payload,
  }),
  SET_REFETCH_DATA: (state: TeamState, payload: boolean) => ({
    ...state,
    isNeedToFetchDataAfterUpdate: payload,
  }),
  SET_EMPLOYEE_NAME: (state: TeamState, payload: string) => ({
    ...state,
    employeeName: payload,
    action: "SET",
    start: 0,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
    pageLength: initialState.pageLength,
  }),
  SET_STATUS_FILTER: (state: TeamState, payload: Array<string>) => ({
    ...state,
    statusFilter: payload,
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
    action: "SET",
  }),
  UPDATE_DATA: (state: TeamState, payload: any) => ({
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
  UPDATE_EMP_DATA: (state: TeamState, payload: any) => ({
    ...state,
    data: {
      ...state.data,
      data: { ...state.data.data, ...payload.data },
    },
    isLoading: false,
  }),
  SET_TIMESHEET: (state: TeamState, payload: any) => ({
    ...state,
    timesheet: payload.timesheet,
    employee: payload.id,
  }),
  SET_WEEK_DATE: (state: TeamState, payload: string) => ({
    ...state,
    weekDate: payload,
    start: 0,
    pageLength: initialState.pageLength,
    action: "SET",
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_EMPLOYEE_WEEK_DATE: (state: TeamState, payload: string) => ({
    ...state,
    employeeWeekDate: payload,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_PROJECT: (state: TeamState, payload: Array<string>) => ({
    ...state,
    project: payload,
    action: "SET",
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_START: (state: TeamState, payload: number) => ({
    ...state,
    start: payload,
    pageLength: initialState.pageLength,
    action: "UPDATE",
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_HAS_MORE: (state: TeamState, payload: boolean) => ({
    ...state,
    hasMore: payload,
  }),
  SET_DATE_RANGE: (
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
  SET_APPROVAL_DIALOG: (state: TeamState, payload: boolean) => ({
    ...state,
    isAprrovalDialogOpen: payload,
  }),
  SET_EDIT_DIALOG: (state: TeamState, payload: boolean) => ({
    ...state,
    isEditDialogOpen: payload,
  }),
  SET_EMPLOYEE: (state: TeamState, payload: string) => ({
    ...state,
    employee: payload,
  }),
  SET_DIALOG: (state: TeamState, payload: boolean) => ({
    ...state,
    isDialogOpen: payload,
  }),
  RESET_STATE: () => initialState,
  RESET_TIMESHEET_DATA_STATE: (state: TeamState) => ({
    ...state,
    timesheetData: initialState.timesheetData,
  }),
  SET_TIMESHEET_DATA: (state: TeamState, payload: timesheetDataProps) => ({
    ...state,
    timesheetData: payload,
  }),
  UPDATE_TIMESHEET_DATA: (state: TeamState, payload: timesheetDataProps) => {
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
  SET_USER_GROUP: (state: TeamState, payload: Array<string>) => ({
    ...state,
    userGroup: payload,
    action: "SET",
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_REPORTS_TO: (state: TeamState, payload: string) => ({
    ...state,
    reportsTo: payload,
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_STATUS: (state: TeamState, payload: Array<string>) => ({
    ...state,
    status: payload,
    action: "SET",
    start: 0,
    pageLength: initialState.pageLength,
    isLoading: true,
    isNeedToFetchDataAfterUpdate: true,
  }),
  SET_FILTERS: (
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
  SET_HAS_VIEW_UPDATED: (state: TeamState, payload: boolean) => ({
    ...state,
    hasViewUpdated: payload,
  }),
};

export const reducer = (state: TeamState, action: Action): TeamState => {
  const handler = actionHandlers[action.type];
  if (handler) {
    return handler(state, action.payload as never) as TeamState;
  }
  return state;
};
