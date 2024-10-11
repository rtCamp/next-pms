import { getTodayDate, getFormatedDate } from "@/lib/utils";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { addDays } from "date-fns";
import { DataProp as timesheetDataProps } from "@/types/timesheet";
type DateRange = {
  start_date: string;
  end_date: string;
};
export interface TeamState {
  isFetchAgain: boolean;
  data: dataProps;
  statusFilter: Array<string>;
  status: Array<string>;
  employeeName?: string;
  isDialogOpen: boolean;
  isEditDialogOpen: boolean;
  isAprrovalDialogOpen: boolean;
  weekDate: string;
  employeeWeekDate: string;
  project: Array<string>;
  projectSearch: string;
  userGroup: Array<string>;
  userGroupSearch: string;
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
}

export interface dataProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  projectSearch: "",
  userGroupSearch: "",
  status: ["Active"],
  isEditDialogOpen: false,
  isFetchAgain: false,
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
  // statusFilter: ["Not Submitted"], old
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
};

const TeamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.hasMore = action.payload.has_more;
    },
    setEmployeeName: (state, action: PayloadAction<string>) => {
      state.employeeName = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setStatusFilter: (state, action: PayloadAction<Array<string>>) => {
      state.statusFilter = action.payload;
      state.start = 0;
      state.data = initialState.data;
      state.isFetchAgain = true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateData: (state, action: PayloadAction<any>) => {
      const data = state.data.data;
      state.data.data = { ...data, ...action.payload.data };
      // state.data.dates = action.payload.dates;
      state.hasMore = action.payload.has_more;
    },
    setFetchAgain: (state, action: PayloadAction<boolean>) => {
      state.isFetchAgain = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTimesheet: (state, action: PayloadAction<any>) => {
      state.timesheet = action.payload.timesheet;
      state.employee = action.payload.id;
    },
    setWeekDate: (state, action: PayloadAction<string>) => {
      state.weekDate = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setEmployeeWeekDate: (state, action: PayloadAction<string>) => {
      state.employeeWeekDate = action.payload;
      state.isFetchAgain = true;
    },
    setProject: (state, action: PayloadAction<Array<string>>) => {
      state.project = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
      state.isFetchAgain = true;
    },
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },
    setDateRange: (
      state,
      action: PayloadAction<{
        dateRange: DateRange;
        isAprrovalDialogOpen: boolean;
      }>,
    ) => {
      state.dateRange = action.payload.dateRange;
      state.isAprrovalDialogOpen = action.payload.isAprrovalDialogOpen;
    },
    setApprovalDialog: (state, action: PayloadAction<boolean>) => {
      state.isAprrovalDialogOpen = action.payload;
    },
    setEditDialog: (state, action: PayloadAction<boolean>) => {
      state.isEditDialogOpen = action.payload;
    },
    setEmployee: (state, action: PayloadAction<string>) => {
      state.employee = action.payload;
    },
    setDialog: (state, action: PayloadAction<boolean>) => {
      state.isDialogOpen = action.payload;
    },
    resetState: (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state = initialState;
    },
    resetTimesheetDataState: (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      state.timesheetData = initialState.timesheetData;
    },
    setTimesheetData: (state, action: PayloadAction<timesheetDataProps>) => {
      state.timesheetData = action.payload;
    },
    updateTimesheetData: (state, action: PayloadAction<timesheetDataProps>) => {
      const data = Object.assign(state.timesheetData.data, action.payload.data);
      state.timesheetData.data = data;
      state.timesheetData.working_hour = action.payload.working_hour;
      state.timesheetData.working_frequency = action.payload.working_frequency;
      state.timesheetData.holidays = [
        ...state.timesheetData.holidays,
        ...action.payload.holidays,
      ];
      const existingLeaveIds = new Set(
        state.timesheetData.leaves.map((leave) => leave.name),
      );
      const newLeaves = action.payload.leaves.filter(
        (leave) => !existingLeaveIds.has(leave.name),
      );
      state.timesheetData.leaves = [
        ...state.timesheetData.leaves,
        ...newLeaves,
      ];
    },
    setUsergroup: (state, action: PayloadAction<Array<string>>) => {
      state.userGroup = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setReportsTo: (state, action: PayloadAction<string>) => {
      state.reportsTo = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setStatus: (state, action: PayloadAction<Array<string>>) => {
      state.status = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.isFetchAgain = true;
    },
    setUserGroupSearch: (state, action: PayloadAction<string>) => {
      state.userGroupSearch = action.payload;
    },
    setProjectSearch: (state, action: PayloadAction<string>) => {
      state.projectSearch = action.payload;
    },

    setFilters: (
      state,
      action: PayloadAction<{
        project: Array<string>;
        userGroup: Array<string>;
        statusFilter: Array<string>;
        employeeName: string;
        reportsTo: string;
        status: Array<string>;
      }>,
    ) => {
      state.project = action.payload.project;
      state.userGroup = action.payload.userGroup;
      state.statusFilter = action.payload.statusFilter;
      state.status = action.payload.status;
      state.employeeName = action.payload.employeeName;
      state.reportsTo = action.payload.reportsTo;
      state.start = 0;
      state.data = initialState.data;
      state.isFetchAgain = true;
    },
  },
});

export const {
  setData,
  setFetchAgain,
  setTimesheet,
  setWeekDate,
  setProject,
  setStart,
  setHasMore,
  updateData,
  setDateRange,
  setApprovalDialog,
  setEmployee,
  setDialog,
  resetState,
  setTimesheetData,
  updateTimesheetData,
  setUsergroup,
  setUserGroupSearch,
  setProjectSearch,
  resetTimesheetDataState,
  setStatusFilter,
  setFilters,
  setEmployeeWeekDate,
  setEditDialog,
  setEmployeeName,
  setStatus,
  setReportsTo,
} = TeamSlice.actions;
export default TeamSlice.reducer;
