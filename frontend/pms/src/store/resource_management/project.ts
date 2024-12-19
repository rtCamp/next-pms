import { getTodayDate, getFormatedDate } from "@/lib/utils";
import {
  ResourceAllocationObjectProps,
  ResourceCustomerObjectProps,
} from "@/types/resource_management";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { DateProps } from "../team";
import { DateRange } from "./team";

export type ProjectDataProps = {
  name: string;
  image: string;
  project_name: string;
  all_dates_data: ProjectResourceProps[];
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
  is_last_week_day: boolean;
  is_on_leave: boolean;
  total_leave_hours: number;
};

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
  isBillable: number;
  reportingManager: string;
  customer?: string[];
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
    view: "planned-vs-capacity",
  },
  isNeedToFetchDataAfterUpdate: false,
  isBillable: -1,
  customer: [],
};

const ResourceTeamSlice = createSlice({
  name: "resource_team",
  initialState,
  reducers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setData: (state, action: PayloadAction<any>) => {
      state.data = action.payload;
      state.hasMore = action.payload.has_more;
      state.pageLength = initialState.pageLength;
    },
    setProjectName: (state, action: PayloadAction<string>) => {
      state.projectName = action.payload;
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
        projectName: string;
        reportingManager?: string;
        customer: string[];
        view?: string;
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
      if (action.payload.view) {
        state.tableView.view = action.payload.view;
      }
      state.pageLength = initialState.pageLength;
      state.start = 0;
      state.data = initialState.data;
    },
    setReportingManager: (state, action: PayloadAction<string>) => {
      state.reportingManager = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.pageLength = initialState.pageLength;
    },
    setCustomer: (state, action: PayloadAction<string[]>) => {
      state.customer = action.payload;
      state.data = initialState.data;
      state.start = 0;
      state.pageLength = initialState.pageLength;
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
    setIsBillable: (state, action: PayloadAction<string[]>) => {
      if (action.payload.length == 2 || action.payload.length == 0) {
        state.isBillable = -1;
      } else if (action.payload[0] == "billable") {
        state.isBillable = 1;
      } else {
        state.isBillable = 0;
      }
      state.pageLength = initialState.pageLength;
      state.start = 0;
      state.data = initialState.data;
    },
  },
});

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
  setReportingManager,
  setProjectName,
  setCustomer,
  setBusinessUnit,
  setCombineWeekHours,
  setView,
  setReFetchData,
  setIsBillable,
} = ResourceTeamSlice.actions;
export default ResourceTeamSlice.reducer;
