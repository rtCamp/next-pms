/**
 * External dependencies.
 */
import { getTodayDate, getFormatedDate } from "@next-pms/design-system/date";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  ResourceAllocationObjectProps,
  ResourceCustomerObjectProps,
} from "@/types/resource_management";
import { DateProps } from "../team";
import { DateRange } from "./team";

export type ProjectAllWeekDataProps = {
  total_allocated_hours: number;
  total_worked_hours: number;
};

export type ProjectDataProps = {
  name: string;
  image: string;
  project_name: string;
  all_dates_data: ProjectResourceObjectProps;
  all_week_data: ProjectAllWeekDataProps[];
  project_allocations: ResourceAllocationObjectProps;
};

export interface ResourceProjectDataProps {
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
  maxWeek: number;
  action: "SET" | "UPDATE";
  billingType?: string[];
}

export const initialState: ResourceTeamState = {
  action: "SET",
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
  billingType: [],
  allocationType: [],
  isLoading: true,
  maxWeek: 5,
};

const ResourceTeamSlice = createSlice({
  name: "resource_project",
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<ResourceProjectDataProps>) => {
      state.data = action.payload;
      state.hasMore = action.payload.has_more;
      state.isLoading = false;
    },
    updateData: (state, action: PayloadAction<ResourceProjectDataProps>) => {
      state.data.data = [...state.data.data, ...action.payload.data];
      state.data.customer = {
        ...state.data.customer,
        ...action.payload.customer,
      };
      state.data.dates = action.payload.dates;
      state.data.total_count = action.payload.total_count;
      state.hasMore = action.payload.has_more;
      state.isLoading = false;
    },
    setProjectName: (state, action: PayloadAction<string>) => {
      state.projectName = action.payload;
      state.start = 0;
      state.isNeedToFetchDataAfterUpdate = true;
      state.isLoading = true;
      state.maxWeek = initialState.maxWeek;
      state.action = "SET";
    },
    setBusinessUnit: (state, action: PayloadAction<string[]>) => {
      state.businessUnit = action.payload;
      state.start = 0;
      state.isNeedToFetchDataAfterUpdate = true;
      state.isLoading = true;
      state.maxWeek = initialState.maxWeek;
      state.action = "SET";
    },
    setMaxWeek: (state, action: PayloadAction<number>) => {
      if (state.maxWeek === action.payload) return;
      state.maxWeek = action.payload;
      state.isLoading = true;
      state.isNeedToFetchDataAfterUpdate = true;
      state.start = 0;
      state.pageLength = state.data.data.length;
      state.action = "SET";
    },
    setWeekDate: (state, action: PayloadAction<string>) => {
      state.weekDate = action.payload;
      state.start = 0;
      state.isLoading = true;
      state.pageLength = initialState.pageLength;
      state.isNeedToFetchDataAfterUpdate = true;
      state.maxWeek = initialState.maxWeek;
      state.action = "SET";
    },
    setEmployeeWeekDate: (state, action: PayloadAction<string>) => {
      state.employeeWeekDate = action.payload;
    },
    setStart: (state, action: PayloadAction<number>) => {
      state.start = action.payload;
      state.isNeedToFetchDataAfterUpdate = true;
      state.action = "UPDATE";
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
        billingType?: string[];
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
      if (action.payload.billingType) {
        state.billingType = action.payload.billingType;
      }

      state.start = 0;
      state.isLoading = true;
      state.isNeedToFetchDataAfterUpdate = true;
      state.action = "SET";
      state.maxWeek = initialState.maxWeek;
    },
    deleteFilters: (
      state,
      action: PayloadAction<{
        type: "project" | "customer" | "allocation-type" | "billing-type";
        projectName?: string;
        reportingManager?: string[];
        customer?: string[];
        allocationType?: string[];
        billingType?: string[];
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
      if (action.payload.type === "billing-type") {
        state.billingType = action.payload.billingType;
      }

      state.start = 0;
      state.isLoading = true;
      state.isNeedToFetchDataAfterUpdate = true;
      state.action = "SET";
      state.maxWeek = initialState.maxWeek;
    },
    setReportingManager: (state, action: PayloadAction<string>) => {
      state.reportingManager = action.payload;
      state.start = 0;
      state.isLoading = true;
      state.isNeedToFetchDataAfterUpdate = true;
      state.action = "SET";
      state.maxWeek = initialState.maxWeek;
    },
    setCustomer: (state, action: PayloadAction<string[]>) => {
      state.customer = action.payload;
      state.start = 0;
      state.isLoading = true;
      state.isNeedToFetchDataAfterUpdate = true;
      state.action = "SET";
      state.maxWeek = initialState.maxWeek;
    },
    setBillingType: (state, action: PayloadAction<string[]>) => {
      state.billingType = action.payload;
      state.start = 0;
      state.isLoading = true;
      state.isNeedToFetchDataAfterUpdate = true;
      state.action = "SET";
      state.maxWeek = initialState.maxWeek;
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
      state.isNeedToFetchDataAfterUpdate = true;
      state.action = "SET";
      state.maxWeek = initialState.maxWeek;
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
  updateData,
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
  setMaxWeek,
  setBillingType,
} = ResourceTeamSlice.actions;
export default ResourceTeamSlice.reducer;
