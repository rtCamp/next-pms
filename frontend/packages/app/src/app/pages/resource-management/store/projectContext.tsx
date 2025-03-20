/**
 * External dependencies.
 */
import { useState } from "react";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system";
import { createContext } from "use-context-selector";

/**
 * Internal dependencies.
 */
import type {
  APIController,
  ContextProviderProps,
  DateProps,
  OptionalResourceProjectFilters,
  ProjectContextProps,
  ProjectResourceProps,
  ResourceProjectDataProps,
  ResourceProjectFilter,
  TableViewProps,
} from "./types";

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
