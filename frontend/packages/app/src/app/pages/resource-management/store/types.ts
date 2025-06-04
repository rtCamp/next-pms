/**
 * External dependencies.
 */
import type { ReactNode } from "react";

/**
 * Internal dependencies.
 */
import type {
  ResourceAllocationObjectProps,
  ResourceCustomerObjectProps,
} from "@/types/resource_management";
import type {
  ResourceAllocationCustomerProps,
  ResourceAllocationEmployeeProps,
  ResourceAllocationTimeLineFilterProps,
  ResourceAllocationTimeLineProps,
} from "../timeline/types";

export type PermissionProps = {
  read?: boolean;
  write?: boolean;
  delete?: boolean;
  isNeedToSetPermission?: boolean;
};

export type DateProps = {
  start_date: string;
  end_date: string;
  key: string;
  dates: string[];
};

export type DateRange = {
  start_date: string;
  end_date: string;
};

export interface APIController {
  isNeedToFetchDataAfterUpdate: boolean;
  isLoading: boolean;
  action: "SET" | "UPDATE";
}

export interface TableViewProps {
  combineWeekHours: boolean;
  view: string;
  tableCell?: {
    width: number;
    height: number;
  };
}

export type ResourceKeys =
  | "project"
  | "employee"
  | "is_billable"
  | "customer"
  | "total_allocated_hours"
  | "hours_allocated_per_day"
  | "allocation_start_date"
  | "allocation_end_date"
  | "note";

export interface ContextProviderProps {
  children: ReactNode;
}

export type AllocationDataProps = {
  employee: string;
  is_billable: boolean;
  project: string;
  project_name: string;
  customer: string;
  customer_name: string;
  total_allocated_hours: string;
  hours_allocated_per_day: string;
  allocation_start_date: string;
  allocation_end_date: string;
  note: string;
  name: string;
  employee_name: string;
};

export type ProjectAllWeekDataProps = {
  total_allocated_hours: number;
  total_worked_hours: number;
};

export interface ResourceProjectDataProps {
  data: ProjectDataProps[];
  dates: DateProps[];
  customer: ResourceCustomerObjectProps;
  total_count: number;
  has_more: boolean;
}

export type ProjectAllocationForDateProps = {
  name: string;
  date: string;
};

export type ProjectResourceProps = {
  date: string;
  total_allocated_hours: number;
  total_worked_hours: number;
  project_resource_allocation_for_given_date: ProjectAllocationForDateProps[];
};

export type ProjectDataProps = {
  name: string;
  image: string;
  project_name: string;
  all_dates_data: Record<string, ProjectResourceProps>;
  all_week_data: ProjectAllWeekDataProps[];
  project_allocations: ResourceAllocationObjectProps;
};

export interface ResourceProjectFilter {
  projectName?: string;
  weekDate: string;
  pageLength: number;
  businessUnit?: string[];
  start: number;
  reportingManager: string;
  customer?: string[];
  allocationType?: string[];
  maxWeek: number;
  employeeWeekDate: string;
  billingType?: string[];
}

export interface OptionalResourceProjectFilters {
  projectName?: string;
  weekDate?: string;
  pageLength?: number;
  businessUnit?: string[];
  start?: number;
  reportingManager?: string;
  customer?: string[];
  allocationType?: string[];
  maxWeek?: number;
  employeeWeekDate?: string;
  billingType?: string[];
}

export interface ResourceProjectState {
  state: {
    projectData: ResourceProjectDataProps;
    filters: ResourceProjectFilter;
    tableView: TableViewProps;
    apiController: APIController;
  };
}

export interface ProjectContextProps extends ResourceProjectState {
  actions: {
    setStart: (start: number) => void;
    updateTableView: (updatedTableView: TableViewProps) => void;
    resetState: () => void;
    setReFetchData: (value: boolean) => void;
    updateFilter: (updatedFilters: OptionalResourceProjectFilters) => void;
    updateProjectData: (
      updatedProjectData: ResourceProjectDataProps,
      type?: "SET" | "UPDATE"
    ) => void;
    getHasMore: () => boolean;
    setMaxWeek: (maxWeek: number) => void;
    setDates: (dates: DateProps[]) => void;
    setCombineWeekHours: (value: boolean) => void;
    setWeekDate: (value: string) => void;
  };
}

export interface DialogStateProps {
  isShowDialog: boolean;
  isNeedToEdit: boolean;
}

export interface ResourceFormContextProps {
  state: {
    dialogState: DialogStateProps;
    allocationData: AllocationDataProps;
    permission: PermissionProps;
  };
  actions: {
    updateDialogState: (value: DialogStateProps) => void;
    updateAllocationData: (value: AllocationDataProps) => void;
    updatePermission: (value: PermissionProps) => void;
    resetState: () => void;
  };
}

export type EmployeeAllWeekDataProps = {
  total_allocated_hours: number;
  total_worked_hours: number;
  total_working_hours: number;
};

export type EmployeeAllocationForDateProps = {
  name: string;
  date: string;
  total_worked_hours_resource_allocation: number;
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
  all_week_data: Record<string, EmployeeAllWeekDataProps>;
  all_leave_data: Record<string, number>;
  employee_allocations: ResourceAllocationObjectProps;
  max_allocation_count_for_single_date: number;
  employee_daily_working_hours: number;
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

export interface Skill {
  name: string;
  proficiency: number;
  operator: string;
}

export interface SkillData {
  name: string;
}

export interface ResourceTeamDataProps {
  data: EmployeeDataProps[];
  dates: DateProps[];
  customer: ResourceCustomerObjectProps;
  total_count: number;
  has_more: boolean;
}

export interface ResourceTeamFilters {
  employeeName?: string;
  businessUnit?: string[];
  reportingManager?: string;
  designation?: string[];
  weekDate: string;
  employeeWeekDate: string;
  allocationType?: string[];
  start: number;
  pageLength: number;
  maxWeek: number;
  skillSearch?: Skill[];
}

export interface OptionalResourceTeamFilters {
  employeeName?: string;
  businessUnit?: string[];
  reportingManager?: string;
  designation?: string[];
  weekDate?: string;
  employeeWeekDate?: string;
  allocationType?: string[];
  start?: number;
  pageLength?: number;
  maxWeek?: number;
  skillSearch?: Skill[];
}

export interface ResourceTeam {
  teamData: ResourceTeamDataProps;
  filters: ResourceTeamFilters;
  tableView: TableViewProps;
  apiController: APIController;
  hasViewUpdated: boolean;
}
export interface ResourceTeamState {
  state: ResourceTeam;
}

export interface TeamContextProps extends ResourceTeamState {
  actions: {
    setStart: (start: number) => void;
    updateTableView: (updatedTableView: TableViewProps) => void;
    resetState: () => void;
    setReFetchData: (value: boolean) => void;
    updateFilter: (updatedFilters: OptionalResourceTeamFilters) => void;
    updateTeamData: (
      updatedTeamData: ResourceTeamDataProps,
      type?: "SET" | "UPDATE"
    ) => void;
    getHasMore: () => boolean;
    setMaxWeek: (maxWeek: number) => void;
    setDates: (dates: DateProps[]) => void;
    setCombineWeekHours: (value: boolean) => void;
    setWeekDate: (value: string) => void;
    setHasViewUpdated: (value: boolean) => void;
  };
}
export interface TimeLineContextState {
  employees: ResourceAllocationEmployeeProps[];
  allocations: ResourceAllocationTimeLineProps[];
  customer: ResourceAllocationCustomerProps;
  filters: ResourceAllocationTimeLineFilterProps;
  apiControler: APIControlerProps;
  hasViewUpdated: boolean;
  allocationData: {
    isNeedToDelete: boolean;
    old?: ResourceAllocationTimeLineProps;
    new?: ResourceAllocationTimeLineProps;
  };
  isShowMonth?: boolean;
}
export interface TimeLineContextProps {
  state: TimeLineContextState;
  actions: {
    setEmployeesData: (
      value: ResourceAllocationEmployeeProps[],
      hasMore: boolean
    ) => void;
    setAllocationsData: (
      value: ResourceAllocationTimeLineProps[],
      type?: "Set" | "Update"
    ) => void;
    setCustomerData: (value: ResourceAllocationCustomerProps) => void;
    getLastTimeLineItem: () => string;
    verticalLoderRef: (element: HTMLElement | null) => void;
    updateFilters: (filters: ResourceAllocationTimeLineFilterProps) => void;
    updateApiControler: (apiControler: APIControlerProps) => void;
    getAllocationWithID: (
      id: string
    ) => ResourceAllocationTimeLineProps | undefined;
    getEmployeeWithID: (id: string) => ResourceAllocationEmployeeProps;
    updateAllocation: (
      updatedAllocation: ResourceAllocationTimeLineProps,
      type?: "Append" | "Update"
    ) => ResourceAllocationTimeLineProps;
    getEmployeeWithIndex: (
      index: number
    ) => ResourceAllocationEmployeeProps | -1;
    isEmployeeExits: (name: string) => boolean | undefined;
    setAllocationData: (value: {
      isNeedToDelete: boolean;
      old?: ResourceAllocationTimeLineProps;
      new?: ResourceAllocationTimeLineProps;
    }) => void;
    setHasViewUpdated: (value: boolean) => void;
  };
}

export interface APIControlerProps {
  isLoading?: boolean;
  hasMore?: boolean;
  isNeedToFetchDataAfterUpdate?: boolean;
}

export interface TimeLineContextProviderProps {
  children: ReactNode;
}
