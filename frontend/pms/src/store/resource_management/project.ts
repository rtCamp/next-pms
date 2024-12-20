/**
 * External dependencies.
 */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { getTodayDate, getFormatedDate } from "@/lib/utils";
import {
  ResourceAllocationObjectProps,
  ResourceCustomerObjectProps,
} from "@/types/resource_management";
import { DateProps } from "../team";
import { DateRange } from "./team";

export type ProjectDataProps = {
  name: string;
  image: string;
  project_name: string;
  all_dates_data: ProjectResourceObjectProps;
  all_week_data: [];
  project_allocations: ResourceAllocationObjectProps;
};

export interface ResourceProjectDataProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: ProjectDataProps[];
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

export type ProjectResourceProps = {
  date: string;
  total_allocated_hours: number;
  total_worked_hours: number;
  project_resource_allocation_for_given_date: ProjectAllocationForDateProps[];
};

export interface ProjectResourceObjectProps {
  [date: string]: ProjectResourceProps;
}

export type ProjectAllocationForDateProps = {
  name: string;
  date: string;
};

export interface ResourceTeamState {
  data: ResourceProjectDataProps;
  projectName?: string;
  businessUnit?: string[];
  isDialogOpen: boolean;
  isEditDialogOpen: boolean;
  weekDate: string;
  employeeWeekDate: string;
  pageLength: number;
  start: number;
  dateRange: DateRange;
  hasMore: boolean;
  tableView: TableViewProps;
  isNeedToFetchDataAfterUpdate: boolean;
  reportingManager: string;
  customer?: string[];
  allocationType?: string[];
  isLoading?: boolean;
}

export const initialState: ResourceTeamState = {
  projectName: "",
  isEditDialogOpen: false,
  reportingManager: "",
  pageLength: 20,
  data: {
    data: [],
    dates: [],
    customer: {},
    total_count: 0,
    has_more: false,
  },
  isDialogOpen: false,
  weekDate: getFormatedDate(getTodayDate()),
  employeeWeekDate: getFormatedDate(getTodayDate()),
  start: 0,
  hasMore: true,
  dateRange: {
    start_date: "",
    end_date: "",
  },
  tableView: {
    combineWeekHours: false,
    view: "planned",
  },
  isNeedToFetchDataAfterUpdate: false,
  customer: [],
  allocationType: [],
  isLoading: true,
};

const ResourceTeamSlice = createSlice({
  name: "resource_team",
  initialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.hasMore = action.payload.has_more;
      state.isLoading = false;
    },
    setProjectName: (state, action: PayloadAction<string>) => {
      state.projectName = action.payload;
      state.start = 0;
      state.isLoading = true;
    },
    setBusinessUnit: (state, action: PayloadAction<string[]>) => {
      state.businessUnit = action.payload;
      state.start = 0;
      state.isLoading = true;
    },
    setWeekDate: (state, action: PayloadAction<string>) => {
      state.weekDate = action.payload;
      state.start = 0;
      state.isLoading = true;
      const pageLength = Object.keys(state.data.data).length;
      state.pageLength = pageLength;
    },
    setEmployeeWeekDate: (state, action: PayloadAction<string>) => {
      state.employeeWeekDate = action.payload;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
      state.isLoading = true;
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
        projectName: string;
        reportingManager?: string;
        customer: string[];
        view?: string;
        allocationType?: string[];
        combineWeekHours?: boolean;
      }>
    ) => {
      state.projectName = action.payload.projectName;
      if (action.payload.reportingManager) {
        state.reportingManager = action.payload.reportingManager;
      }
      if (action.payload.customer) {
        state.customer = action.payload.customer;
      }
      if (action.payload.combineWeekHours) {
        state.tableView.combineWeekHours = action.payload.combineWeekHours;
      }
      if (action.payload.allocationType) {
        state.allocationType = action.payload.allocationType;
      }
      if (action.payload.view) {
        state.tableView.view = action.payload.view;
      }

      state.start = 0;
      state.isLoading = true;
    },
    deleteFilters: (
      state,
      action: PayloadAction<{
        type: "project" | "customer" | "allocation-type";
        projectName?: string;
        reportingManager?: string[];
        customer?: string[];
        allocationType?: string[];
      }>
    ) => {
      if (action.payload.type === "project") {
        state.projectName = action.payload.projectName;
      }
      if (action.payload.type === "customer") {
        state.customer = action.payload.customer;
      }
      if (action.payload.type === "allocation-type") {
        state.allocationType = action.payload.allocationType;
      }

      state.start = 0;
      state.isLoading = true;
    },
    setReportingManager: (state, action: PayloadAction<string>) => {
      state.reportingManager = action.payload;
      state.start = 0;
      state.isLoading = true;
    },
    setCustomer: (state, action: PayloadAction<string[]>) => {
      state.customer = action.payload;
      state.start = 0;
      state.isLoading = true;
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
      state.start = 0;
      state.isLoading = true;
    },
  },
});

export const emptyProjectDayData: ProjectResourceProps = {
  date: "None",
  total_allocated_hours: 0,
  total_worked_hours: 0,
  project_resource_allocation_for_given_date: [],
};

export const {
  setData,
  setWeekDate,
  setStart,
  setHasMore,
  setDateRange,
  resetState,
  setFilters,
  setEmployeeWeekDate,
  setReportingManager,
  setProjectName,
  setCustomer,
  setBusinessUnit,
  setCombineWeekHours,
  deleteFilters,
  setView,
  setReFetchData,
  setAllocationType,
} = ResourceTeamSlice.actions;
export default ResourceTeamSlice.reducer;
