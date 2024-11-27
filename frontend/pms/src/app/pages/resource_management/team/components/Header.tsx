import {
  setWeekDate,
  setEmployeeName,
  setBusinessUnit,
  setFilters,
  resetState,
  setCombineWeekHours,
  setView,
} from "@/store/resource_management/team";
import { getFormatedDate } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import { addDays } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQueryParamsState } from "@/lib/queryParam";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ResourceHeaderSection } from "../../components/Header";
import { ChevronLeftIcon, ChevronRight, Plus } from "lucide-react";
import { setDialog } from "@/store/resource_management/allocation";

const ResourceTeamHeaderSection = () => {
  const [businessUnitParam, setBusinessUnitParam] = useQueryParamsState<string[]>("business-unit", []);
  const [employeeNameParam, setEmployeeNameParam] = useQueryParamsState<string>("employee-name", "");
  const [viewParam, setViewParam] = useQueryParamsState<string>("view-type", "planned-vs-capacity");
  const [combineWeekHoursParam, setCombineWeekHoursParam] = useQueryParamsState<boolean>("combine-week-hours", false);

  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const resourceTeamStateTableView = resourceTeamState.tableView;
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setView(viewParam));
    dispatch(setCombineWeekHours(combineWeekHoursParam));
    const payload = {
      businessUnit: businessUnitParam,
      employeeName: employeeNameParam,
    };
    dispatch(setFilters(payload));
    return () => {
      dispatch(resetState());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: businessUnit } = useFrappeGetCall(
    "frappe.client.get_list",
    {
      doctype: "Business Unit",
      fields: ["name"],
      limit_page_length: 0,
    },
    undefined,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  const handlePrevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].start_date, -3));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  const handleNextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].end_date, +1));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  const handleBusinessUnitChange = useCallback(
    (value: string | string[]) => {
      dispatch(setBusinessUnit(value as string[]));
      setBusinessUnitParam(value as string[]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const handleEmployeeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setEmployeeName(e.target.value));
      setEmployeeNameParam(e.target.value);
    },
    [dispatch, setEmployeeNameParam]
  );

  const handleViewChange = useCallback(
    (value: string) => {
      setViewParam(value);
      dispatch(setView(value));
    },
    [dispatch, setViewParam]
  );

  const handleWeekViewChange = useCallback(() => {
    setCombineWeekHoursParam(!resourceTeamStateTableView.combineWeekHours);
    dispatch(setCombineWeekHours(!resourceTeamStateTableView.combineWeekHours));
  }, [dispatch, resourceTeamStateTableView.combineWeekHours, setCombineWeekHoursParam]);

  return (
    <ResourceHeaderSection
      filters={[
        {
          queryParameterName: "employee-name",
          handleChange: handleEmployeeChange,
          type: "search",
          value: employeeNameParam,
          defaultValue: "",
          label: "Employee Name",
        },
        {
          queryParameterName: "business-unit",
          handleChange: handleBusinessUnitChange,
          type: "select-search",
          value: businessUnitParam,
          defaultValue: "",
          label: "Business Unit",
          data:
            businessUnit?.message?.map((d: { name: string }) => ({
              label: d.name,
              value: d.name,
            })) ?? [],
        },
        {
          queryParameterName: "view-type",
          handleChange: handleViewChange,
          type: "select",
          value: resourceTeamStateTableView.view,
          defaultValue: "planned-vs-capacity",
          label: "Views",
          data: [
            {
              label: "Planned vs Capacity",
              value: "planned-vs-capacity",
            },
            {
              label: "Actual vs Planned",
              value: "actual-vs-planned",
            },
          ],
        },
        {
          queryParameterName: "combine-week-hours",
          handleChange: handleWeekViewChange,
          type: "checkbox",
          value: resourceTeamStateTableView.combineWeekHours,
          defaultValue: false,
          label: "Combine Week Hours",
        },
      ]}
      buttons={[
        {
          title: "add-allocation",
          handleClick: () => {
            dispatch(setDialog(true));
          },
          icon: () => <Plus className="w-4 max-md:w-3 h-4 max-md:h-3 bg" />,
          variant: "default",
        },
        {
          title: "previous-week",
          handleClick: handlePrevWeek,
          icon: () => <ChevronLeftIcon className="w-4 max-md:w-3 h-4 max-md:h-3" />,
        },
        {
          title: "next-week",
          handleClick: handleNextWeek,
          icon: () => <ChevronRight className="w-4 max-md:w-3 h-4 max-md:h-3" />,
        },
      ]}
    />
  );
};

export { ResourceTeamHeaderSection };
