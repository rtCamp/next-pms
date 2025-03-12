/**
 * External dependencies.
 */
import { createContext, useState } from "react";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system";
import { ResourceAllocationObjectProps, ResourceCustomerObjectProps } from "@/types/resource_management";

/**
 * Internal dependencies.
 */
import { APIController, ContextProviderProps, DateProps, TableViewProps } from "./types";

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
  projectData: ResourceProjectDataProps;
  filters: ResourceProjectFilter;
  tableView: TableViewProps;
  apiController: APIController;
}

interface ProjectContextProps extends ResourceProjectState {
  setStart: (start: number) => void;
  updateTableView: (updatedTableView: TableViewProps) => void;
  resetState: () => void;
  setReFetchData: (value: boolean) => void;
  updateFilter: (updatedFilters: OptionalResourceProjectFilters) => void;
  updateProjectData: (updatedProjectData: ResourceProjectDataProps, type?: "SET" | "UPDATE") => void;
  getHasMore: () => boolean;
  setMaxWeek: (maxWeek: number) => void;
  setDates: (dates: DateProps[]) => void;
  setCombineWeekHours: (value: boolean) => void;
  setWeekDate: (value: string) => void;
}

const emptyProjectDayData: ProjectResourceProps = {
  date: "None",
  total_allocated_hours: 0,
  total_worked_hours: 0,
  project_resource_allocation_for_given_date: [],
};

const defaultFilters: ResourceProjectFilter = {
  projectName: "",
  reportingManager: "",
  pageLength: 20,
  weekDate: getFormatedDate(getTodayDate()),
  employeeWeekDate: getFormatedDate(getTodayDate()),
  start: 0,
  customer: [],
  billingType: [],
  allocationType: [],
  maxWeek: 5,
};
const defaultData: ResourceProjectDataProps = {
  data: [],
  dates: [],
  customer: {},
  total_count: 0,
  has_more: false,
};
const defaultTableView: TableViewProps = {
  combineWeekHours: false,
  view: "planned",
};
const defaultApiController: APIController = {
  isNeedToFetchDataAfterUpdate: false,
  isLoading: false,
  action: "SET",
};
const defaulProjectState: ProjectContextProps = {
  projectData: defaultData,
  filters: defaultFilters,
  tableView: defaultTableView,
  apiController: defaultApiController,
  setStart: () => {},
  updateTableView: () => {},
  resetState: () => {},
  setReFetchData: () => {},
  updateFilter: () => {},
  updateProjectData: () => {},
  getHasMore: () => false,
  setMaxWeek: () => {},
  setDates: () => {},
  setCombineWeekHours: () => {},
  setWeekDate: () => {},
};

const ProjectContext = createContext<ProjectContextProps>(defaulProjectState);

const ProjectContextProvider = ({ children }: ContextProviderProps) => {
  const [projectData, setProjectData] = useState<ResourceProjectDataProps>(defaultData);
  const [filters, setFilters] = useState<ResourceProjectFilter>(defaultFilters);
  const [tableView, setTableView] = useState<TableViewProps>(defaultTableView);
  const [apiController, setApiController] = useState<APIController>(defaultApiController);

  const updateProjectData = (updatedProjectData: ResourceProjectDataProps, type: "SET" | "UPDATE" = "SET") => {
    if (!updatedProjectData || updatedProjectData.dates.length === 0) {
      return;
    }
    if (type === "SET") {
      setProjectData({
        ...updatedProjectData,
      });
    } else {
      setProjectData({
        ...projectData,
        data: [...projectData.data, ...updatedProjectData.data],
        dates: updatedProjectData.dates,
        customer: { ...projectData.customer, ...projectData.customer },
        total_count: projectData.total_count,
        has_more: projectData.has_more,
      });
    }

    setApiController({ ...apiController, isNeedToFetchDataAfterUpdate: false, isLoading: false });
  };

  const setStart = (start: number) => {
    setFilters({ ...filters, start });
    setApiController({ ...apiController, isLoading: true, isNeedToFetchDataAfterUpdate: true, action: "UPDATE" });
  };

  const updateFilter = (updatedFilters: OptionalResourceProjectFilters) => {
    setFilters({ ...filters, ...updatedFilters, start: 0, maxWeek: defaultFilters.maxWeek });
    updateProjectData(defaultData);
    setApiController({ ...apiController, isLoading: true, isNeedToFetchDataAfterUpdate: true, action: "SET" });
  };

  const updateTableView = (updatedTableView: TableViewProps) => {
    setTableView({ ...defaultTableView, ...updatedTableView });
  };

  const setReFetchData = (value: boolean) => {
    setApiController({ ...apiController, isNeedToFetchDataAfterUpdate: value });
  };

  const setMaxWeek = (maxWeek: number) => {
    if (maxWeek === filters.maxWeek) return;
    setFilters({ ...filters, maxWeek, start: 0, pageLength: defaultFilters.pageLength });
    setApiController({ ...apiController, isLoading: true, isNeedToFetchDataAfterUpdate: true, action: "SET" });
  };

  const setDates = (dates: DateProps[]) => {
    setProjectData({ ...projectData, dates });
  };

  const setWeekDate = (value: string) => {
    setFilters({
      ...filters,
      weekDate: value,
      start: 0,
      pageLength: defaultFilters.pageLength,
      maxWeek: defaultFilters.maxWeek,
    });
    setApiController({ ...apiController, isLoading: true, isNeedToFetchDataAfterUpdate: true, action: "SET" });
  };

  const resetState = () => {
    setProjectData(defaultData);
    setFilters(defaultFilters);
    setTableView(defaultTableView);
    setApiController(defaultApiController);
  };

  const setCombineWeekHours = (value: boolean) => {
    setTableView({ ...tableView, combineWeekHours: value });
  };

  const getHasMore = () => {
    return projectData.has_more;
  };

  return (
    <ProjectContext.Provider
      value={{
        projectData: projectData,
        filters: filters,
        apiController: apiController,
        tableView: tableView,
        setStart: setStart,
        updateTableView: updateTableView,
        resetState: resetState,
        setReFetchData: setReFetchData,
        updateFilter: updateFilter,
        updateProjectData: updateProjectData,
        getHasMore: getHasMore,
        setMaxWeek: setMaxWeek,
        setDates: setDates,
        setCombineWeekHours: setCombineWeekHours,
        setWeekDate: setWeekDate,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export { emptyProjectDayData, ProjectContext, ProjectContextProvider };
