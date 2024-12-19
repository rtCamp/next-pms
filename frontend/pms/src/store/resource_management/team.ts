/**
 * External dependencies.
 */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { getMergeData } from "@/app/pages/resource_management/utils/value";
import { getTodayDate, getFormatedDate } from "@/lib/utils";
import {
  ResourceAllocationObjectProps,
  ResourceCustomerObjectProps,
} from "@/types/resource_management";

export type DateRange = {
  start_date: string;
  end_date: string;
};

export type DateProps = {
  start_date: string;
  end_date: string;
  key: string;
  dates: string[];
};

export type EmployeeDataProps = {
  name: string;
  image: string;
  employee_name: string;
  department: string;
  designation: string;
  working_hour: string;
  working_frequency: string;
  all_dates_data: EmployeeResourceObjectProps;
  all_week_data: [];
  all_leave_data: EmployeeLeaveProps[];
  employee_allocations: ResourceAllocationObjectProps;
  max_allocation_count_for_single_date: number;
  employee_daily_working_hours: number;
};

export interface ResourceTeamDataProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: EmployeeDataProps[];
  dates: DateProps[];
  customer: ResourceCustomerObjectProps;
  total_count: number;
  has_more: boolean;
}

export interface TableViewProps {
  combineWeekHours: boolean;
  view: string;
  tableCell?: {
    width: number;
    height: number;
  };
}

export type EmployeeLeaveProps = {
  string: string;
};

export type EmployeeResourceProps = {
  date: string;
  total_allocated_hours: number;
  total_worked_hours: number;
  total_working_hours: number;
  employee_resource_allocation_for_given_date: EmployeeAllocationForDateProps[];
  is_on_leave: boolean;
  total_leave_hours: number;
  total_allocation_count: number;
};

export type EmployeeResourceObjectProps = {
  [date: string]: EmployeeResourceProps;
};

export type EmployeeAllocationForDateProps = {
  name: string;
  date: string;
  total_worked_hours_resource_allocation: number;
};

export interface ResourceTeamState {
  data: ResourceTeamDataProps;
  employeeName?: string;
  businessUnit?: string[];
  reportingManager?: string;
  designation?: string[];
  isDialogOpen: boolean;
  isEditDialogOpen: boolean;
  weekDate: string;
  employeeWeekDate: string;
  pageLength: number;
  allocationType?: string[];
  start: number;
  dateRange: DateRange;
  hasMore: boolean;
  tableView: TableViewProps;
  isNeedToFetchDataAfterUpdate?: boolean;
}

export const initialState: ResourceTeamState = {
  employeeName: "",
  isEditDialogOpen: false,
  pageLength: 20,
  data: {
    data: [],
    dates: [],
    customer: {},
    total_count: 0,
    has_more: false,
  },
  reportingManager: "",
  isDialogOpen: false,
  weekDate: getFormatedDate(getTodayDate()),
  employeeWeekDate: getFormatedDate(getTodayDate()),
  start: 0,
  allocationType: [],
  hasMore: true,
  dateRange: {
    start_date: "",
    end_date: "",
  },
  designation: [],
  tableView: {
    combineWeekHours: false,
    view: "planned",
  },
  isNeedToFetchDataAfterUpdate: false,
};

const ResourceTeamSlice = createSlice({
  name: "resource_team",
  initialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.hasMore = state.data.has_more;
      state.pageLength = initialState.pageLength;
    },
    setEmployeeName: (state, action: PayloadAction<string>) => {
      state.employeeName = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.pageLength = initialState.pageLength;
    },
    setBusinessUnit: (state, action: PayloadAction<string[]>) => {
      state.businessUnit = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.pageLength = initialState.pageLength;
    },
    setReportingManager: (state, action: PayloadAction<string>) => {
      state.reportingManager = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.pageLength = initialState.pageLength;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateData: (state, action: PayloadAction<any>) => {
      const data = state.data.data;
      state.data.data = [...data, ...action.payload.data];
      state.data.customer = {
        ...state.data.customer,
        ...action.payload.customer,
      };
      state.data.dates = action.payload.dates;
      state.data.total_count = action.payload.total_count;
      state.hasMore = action.payload.has_more;
    },
    setWeekDate: (state, action: PayloadAction<string>) => {
      state.weekDate = action.payload;
      state.start = 0;
      const pageLength = Object.keys(state.data.data).length;
      state.pageLength = pageLength;
      state.data = initialState.data;
    },
    setEmployeeWeekDate: (state, action: PayloadAction<string>) => {
      state.employeeWeekDate = action.payload;
    },
    setStart: (state, action: PayloadAction<number>) => {
      console.log(action.payload)
      state.start = action.payload;
      state.pageLength = initialState.pageLength;
    },
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },
    setDateRange: (
      state,
      action: PayloadAction<{
        dateRange: DateRange;
        isAprrovalDialogOpen: boolean;
      }>
    ) => {
      state.dateRange = action.payload.dateRange;
    },
    setDialog: (state, action: PayloadAction<boolean>) => {
      state.isDialogOpen = action.payload;
    },
    resetState() {
      return initialState;
    },
    setFilters: (
      state,
      action: PayloadAction<{
        employeeName?: string;
        isNeedToRemove?: boolean;
        businessUnit?: string[];
        reportingManager?: string;
        designation?: string[];
        allocationType?: string[];
        view?: string;
        combineWeekHours?: boolean;
      }>
    ) => {
      if (action.payload.employeeName || action.payload.isNeedToRemove) {
        state.employeeName = action.payload.employeeName;
      }
      if (action.payload.reportingManager || action.payload.isNeedToRemove) {
        state.reportingManager = action.payload.reportingManager;
      }

      if (action.payload.businessUnit) {
        state.businessUnit = action.payload.businessUnit;
      }

      if (action.payload.allocationType) {
        state.allocationType = action.payload.allocationType;
      }
      if (action.payload.designation) {
        state.designation = action.payload.designation;
      }
      if (action.payload.combineWeekHours) {
        state.tableView.combineWeekHours = action.payload.combineWeekHours;
      }
      if (action.payload.view) {
        state.tableView.view = action.payload.view;
      }
      state.pageLength = initialState.pageLength;
      state.start = 0;
      state.data = initialState.data;
    },
    deleteFilters: (
      state,
      action: PayloadAction<{
        type:
          | "employee"
          | "business-unit"
          | "repots-to"
          | "designation"
          | "allocation-type";
        employeeName?: string;
        businessUnit?: string[];
        reportingManager?: string;
        designation?: string[];
        allocationType?: string[];
      }>
    ) => {
      if (action.payload.type === "employee") {
        state.employeeName = action.payload.employeeName;
      }
      if (action.payload.type === "business-unit") {
        state.businessUnit = action.payload.businessUnit;
      }
      if (action.payload.type === "repots-to") {
        state.reportingManager = action.payload.reportingManager;
      }
      if (action.payload.type === "designation") {
        state.designation = action.payload.designation;
      }
      if (action.payload.type === "allocation-type") {
        state.allocationType = action.payload.allocationType;
      }

      state.pageLength = initialState.pageLength;
      state.start = 0;
      state.data = initialState.data;
    },
    setCombineWeekHours: (state, action: PayloadAction<boolean>) => {
      state.tableView.combineWeekHours = action.payload;
    },
    setView: (state, action: PayloadAction<string>) => {
      state.tableView.view = action.payload;
    },
    setReFetchData: (state, action: PayloadAction<boolean>) => {
      state.isNeedToFetchDataAfterUpdate = action.payload;
    },
    setAllocationType: (state, action: PayloadAction<string[]>) => {
      state.allocationType = action.payload;
      state.pageLength = initialState.pageLength;
      state.start = 0;
      state.data = initialState.data;
    },
    setDesignation: (state, action: PayloadAction<string[]>) => {
      state.designation = action.payload;
      state.pageLength = initialState.pageLength;
      state.start = 0;
      state.data = initialState.data;
    },
  },
});

export const emptyEmployeeDayData: EmployeeResourceProps = {
  date: "None",
  total_allocated_hours: 0,
  total_working_hours: 0,
  total_worked_hours: 0,
  employee_resource_allocation_for_given_date: [],
  is_on_leave: false,
  total_leave_hours: 0,
  total_allocation_count: 0,
};

export const {
  setData,
  setWeekDate,
  setStart,
  setHasMore,
  updateData,
  setDateRange,
  resetState,
  setFilters,
  setEmployeeWeekDate,
  setEmployeeName,
  setBusinessUnit,
  setCombineWeekHours,
  setAllocationType,
  setView,
  setReFetchData,
  setDesignation,
  setReportingManager,
  deleteFilters,
} = ResourceTeamSlice.actions;
export default ResourceTeamSlice.reducer;
