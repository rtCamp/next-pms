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
  EmployeeDataProps,
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
  projectType: [],
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
  state: {
    teamData: defaultData,
    filters: defaultFilters,
    tableView: defaultTableView,
    apiController: defaultApiController,
    hasViewUpdated: false,
  },
  actions: {
    setStart: () => {},
    updateTableView: () => {},
    resetState: () => {},
    setReFetchData: () => {},
    updateFilter: () => {},
    updateTeamData: () => {},
    mergeHorizontalData: () => {},
    getHasMore: () => false,
    setMaxWeek: () => {},
    setDates: () => {},
    setCombineWeekHours: () => {},
    setWeekDate: () => {},
    setHasViewUpdated: () => false,
  },
};

const TeamContext = createContext<TeamContextProps>(defaulTeamState);

const TeamContextProvider = ({ children }: ContextProviderProps) => {
  const [teamData, setTeamData] = useState<ResourceTeamDataProps>(defaultData);
  const [filters, setFilters] = useState<ResourceTeamFilters>(defaultFilters);
  const [tableView, setTableView] = useState<TableViewProps>(defaultTableView);
  const [apiController, setApiController] =
    useState<APIController>(defaultApiController);

  const updateTeamData = (
    updatedTeamData: ResourceTeamDataProps,
    type: "SET" | "UPDATE" = "SET",
  ) => {
    setTeamData((prev) => {
      if (type === "SET") {
        return {
          ...prev,
          data: updatedTeamData.data,
          dates: updatedTeamData.dates ? updatedTeamData.dates : prev.dates,
          customer: updatedTeamData.customer,
          total_count: updatedTeamData.total_count,
          has_more: updatedTeamData.has_more,
        };
      }

      return {
        ...prev,
        data: [...prev.data, ...updatedTeamData.data],
        dates: updatedTeamData.dates ? updatedTeamData.dates : prev.dates,
        customer: { ...prev.customer, ...updatedTeamData.customer },
        total_count: updatedTeamData.total_count,
        has_more: updatedTeamData.has_more,
      };
    });

    setApiController((prev) => ({
      ...prev,
      isNeedToFetchDataAfterUpdate: false,
      isLoading: false,
    }));
  };

  const mergeHorizontalData = (horizontalData: {
    start: number;
    data: EmployeeDataProps[];
    customer: ResourceTeamDataProps["customer"];
    dates?: DateProps[];
  }) => {
    setTeamData((prev) => {
      const updatedData = [...prev.data];

      for (let i = 0; i < horizontalData.data.length; i++) {
        const idx = horizontalData.start + i;
        if (idx >= updatedData.length) break;

        updatedData[idx] = {
          ...updatedData[idx],
          all_dates_data: {
            ...updatedData[idx].all_dates_data,
            ...horizontalData.data[i].all_dates_data,
          },
          all_leave_data: {
            ...updatedData[idx].all_leave_data,
            ...horizontalData.data[i].all_leave_data,
          },
          all_week_data: {
            ...updatedData[idx].all_week_data,
            ...horizontalData.data[i].all_week_data,
          },
          employee_allocations: {
            ...updatedData[idx].employee_allocations,
            ...horizontalData.data[i].employee_allocations,
          },
        };
      }

      return {
        ...prev,
        data: updatedData,
        customer: { ...prev.customer, ...horizontalData.customer },
        dates: horizontalData.dates ?? prev.dates,
      };
    });
  };

  const setStart = (start: number) => {
    setFilters((prev) => ({ ...prev, start }));
    setApiController((prev) => ({ ...prev, isLoading: true }));
  };

  const updateFilter = (updatedFilters: OptionalResourceTeamFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...updatedFilters,
      start: 0,
      maxWeek: defaultFilters.maxWeek,
    }));
    setTeamData(defaultData);
    setApiController((prev) => ({
      ...prev,
      isLoading: true,
      isNeedToFetchDataAfterUpdate: true,
    }));
  };

  const updateTableView = (updatedTableView: TableViewProps) => {
    setTableView({ ...defaultTableView, ...updatedTableView });
  };

  const setReFetchData = (value: boolean) => {
    setApiController((prev) => ({
      ...prev,
      isNeedToFetchDataAfterUpdate: value,
    }));
  };

  const setMaxWeek = (maxWeek: number) => {
    setFilters((prev) => {
      if (maxWeek === prev.maxWeek) return prev;
      return { ...prev, maxWeek };
    });
  };

  const setDates = (dates: DateProps[]) => {
    setTeamData((prev) => ({ ...prev, dates }));
  };

  const setWeekDate = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      weekDate: value,
      start: 0,
      pageLength: defaultFilters.pageLength,
      maxWeek: defaultFilters.maxWeek,
    }));
    setApiController((prev) => ({
      ...prev,
      isLoading: true,
      isNeedToFetchDataAfterUpdate: true,
    }));
    setTeamData({ ...defaultData, dates: getDatesArrays(value, 10) });
  };

  const resetState = () => {
    setTeamData(defaultData);
    setFilters(defaultFilters);
    setTableView(defaultTableView);
    setApiController(defaultApiController);
  };

  const setCombineWeekHours = (value: boolean) => {
    setTableView((prev) => ({ ...prev, combineWeekHours: value }));
  };

  const getHasMore = () => {
    return teamData.has_more;
  };

  const [hasViewUpdated, setHasViewUpdated] = useState<boolean>(false);

  return (
    <TeamContext.Provider
      value={{
        state: {
          teamData: teamData,
          filters: filters,
          apiController: apiController,
          tableView: tableView,
          hasViewUpdated,
        },
        actions: {
          setStart: setStart,
          updateTableView: updateTableView,
          resetState: resetState,
          setReFetchData: setReFetchData,
          updateFilter: updateFilter,
          updateTeamData: updateTeamData,
          mergeHorizontalData: mergeHorizontalData,
          getHasMore: getHasMore,
          setMaxWeek: setMaxWeek,
          setDates: setDates,
          setCombineWeekHours: setCombineWeekHours,
          setWeekDate: setWeekDate,
          setHasViewUpdated,
        },
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export { defaultEmployeeDayData, TeamContext, TeamContextProvider };
