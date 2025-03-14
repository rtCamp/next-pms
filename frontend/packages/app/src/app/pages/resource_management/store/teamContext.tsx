/**
 * External dependencies.
 */
import { createContext, useState } from "react";
import { getFormatedDate, getTodayDate } from "@next-pms/design-system";

/**
 * Internal dependencies.
 */
import type {
  APIController,
  ContextProviderProps,
  DateProps,
  EmployeeResourceProps,
  OptionalResourceTeamFilters,
  ResourceTeamDataProps,
  ResourceTeamFilters,
  TableViewProps,
  TeamContextProps,
} from "./types";
import { getDatesArrays } from "../utils/dates";

const defaultEmployeeDayData: EmployeeResourceProps = {
  date: "None",
  total_allocated_hours: 0,
  total_working_hours: 0,
  total_worked_hours: 0,
  employee_resource_allocation_for_given_date: [],
  is_on_leave: false,
  total_leave_hours: 0,
  total_allocation_count: 0,
};
const defaultFilters: ResourceTeamFilters = {
  employeeName: "",
  pageLength: 20,
  reportingManager: "",
  weekDate: getFormatedDate(getTodayDate()),
  employeeWeekDate: getFormatedDate(getTodayDate()),
  start: 0,
  allocationType: [],
  designation: [],
  businessUnit: [],
  maxWeek: 5,
  skillSearch: [],
};
const defaultData: ResourceTeamDataProps = {
  data: [],
  dates: getDatesArrays(getFormatedDate(getTodayDate()), 10),
  customer: {},
  total_count: 0,
  has_more: false,
};
const defaultTableView: TableViewProps = {
  combineWeekHours: false,
  view: "planned-vs-capacity",
};
const defaultApiController: APIController = {
  isNeedToFetchDataAfterUpdate: false,
  isLoading: false,
  action: "SET",
};
const defaulTeamState: TeamContextProps = {
  teamData: defaultData,
  filters: defaultFilters,
  tableView: defaultTableView,
  apiController: defaultApiController,
  setStart: () => {},
  updateTableView: () => {},
  resetState: () => {},
  setReFetchData: () => {},
  updateFilter: () => {},
  updateTeamData: () => {},
  getHasMore: () => false,
  setMaxWeek: () => {},
  setDates: () => {},
  setCombineWeekHours: () => {},
  setWeekDate: () => {},
};

const TeamContext = createContext<TeamContextProps>(defaulTeamState);

const TeamContextProvider = ({ children }: ContextProviderProps) => {
  const [teamData, setTeanData] = useState<ResourceTeamDataProps>(defaultData);
  const [filters, setFilters] = useState<ResourceTeamFilters>(defaultFilters);
  const [tableView, setTableView] = useState<TableViewProps>(defaultTableView);
  const [apiController, setApiController] = useState<APIController>(defaultApiController);

  const updateTeamData = (updatedTeamData: ResourceTeamDataProps, type: "SET" | "UPDATE" = "SET") => {
    if (type === "SET") {
      setTeanData({
        ...teamData,
        data: updatedTeamData.data,
        dates: updatedTeamData.dates ? updatedTeamData.dates : teamData.dates,
        customer: updatedTeamData.customer,
        total_count: updatedTeamData.total_count,
        has_more: updatedTeamData.has_more,
      });
    } else {
      setTeanData({
        ...teamData,
        data: [...teamData.data, ...updatedTeamData.data],
        dates: updatedTeamData.dates ? updatedTeamData.dates : teamData.dates,
        customer: { ...updatedTeamData.customer, ...updatedTeamData.customer },
        total_count: updatedTeamData.total_count,
        has_more: updatedTeamData.has_more,
      });
    }

    setApiController({ ...apiController, isNeedToFetchDataAfterUpdate: false, isLoading: false });
  };

  const setStart = (start: number) => {
    setFilters({ ...filters, start });
    setApiController({ ...apiController, isLoading: true });
  };

  const updateFilter = (updatedFilters: OptionalResourceTeamFilters) => {
    setFilters({ ...filters, ...updatedFilters, start: 0, maxWeek: defaultFilters.maxWeek });
    setTeanData(defaultData);
    setApiController({ ...apiController, isLoading: true, isNeedToFetchDataAfterUpdate: true });
  };

  const updateTableView = (updatedTableView: TableViewProps) => {
    setTableView({ ...defaultTableView, ...updatedTableView });
  };

  const setReFetchData = (value: boolean) => {
    setApiController({ ...apiController, isNeedToFetchDataAfterUpdate: value });
  };

  const setMaxWeek = (maxWeek: number) => {
    if (maxWeek === filters.maxWeek) return;
    setFilters({ ...filters, maxWeek });
  };

  const setDates = (dates: DateProps[]) => {
    setTeanData({ ...teamData, dates });
  };

  const setWeekDate = (value: string) => {
    setFilters({
      ...filters,
      weekDate: value,
      start: 0,
      pageLength: defaultFilters.pageLength,
      maxWeek: defaultFilters.maxWeek,
    });
    setApiController({ ...apiController, isLoading: true, isNeedToFetchDataAfterUpdate: true });
    setTeanData({ ...defaultData, dates: getDatesArrays(value, 10) });
  };

  const resetState = () => {
    setTeanData(defaultData);
    setFilters(defaultFilters);
    setTableView(defaultTableView);
    setApiController(defaultApiController);
  };

  const setCombineWeekHours = (value: boolean) => {
    setTableView({ ...tableView, combineWeekHours: value });
  };

  const getHasMore = () => {
    return teamData.has_more;
  };

  return (
    <TeamContext.Provider
      value={{
        teamData: teamData,
        filters: filters,
        apiController: apiController,
        tableView: tableView,
        setStart: setStart,
        updateTableView: updateTableView,
        resetState: resetState,
        setReFetchData: setReFetchData,
        updateFilter: updateFilter,
        updateTeamData: updateTeamData,
        getHasMore: getHasMore,
        setMaxWeek: setMaxWeek,
        setDates: setDates,
        setCombineWeekHours: setCombineWeekHours,
        setWeekDate: setWeekDate,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export { defaultEmployeeDayData, TeamContext, TeamContextProvider };
