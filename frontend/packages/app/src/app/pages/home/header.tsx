/**
 * External dependencies
 */
import { useCallback, useEffect } from "react";
import { getFormatedDate } from "@next-pms/design-system/date";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { ChevronRight, ChevronLeft } from "lucide-react";
/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/list-view/header";
import { Action, HomeState } from "./reducer";

type HeaderProps = {
  homeState: HomeState;
  dispatch: React.Dispatch<Action>;
};
export const Header = ({ homeState, dispatch }: HeaderProps) => {
  const [employeeNameParam] = useQueryParam<string>("employee-name", "");
  const [employeeStatusParam] = useQueryParam<Array<string>>("status", ["Active"]);

  useEffect(() => {
    const payload = {
      employeeName: employeeNameParam,
      status: employeeStatusParam,
    };
    dispatch({ type: "SET_FILTERS", payload });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmployeeChange = useCallback(
    (text: string) => {
      dispatch({ type: "SET_EMPLOYEE_NAME", payload: text.trim() });
    },
    [dispatch]
  );

  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch({ type: "SET_STATUS", payload: normalizedFilters });
    },
    [dispatch]
  );

  const handleprevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(homeState.weekDate, -14));
    dispatch({ type: "SET_WEEK_DATE", payload: date });
  }, [dispatch, homeState.weekDate]);

  const handlenextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(homeState.weekDate, 14));
    dispatch({ type: "SET_WEEK_DATE", payload: date });
  }, [dispatch, homeState.weekDate]);
  const filters = [
    {
      type: "search",
      queryParameterName: "employee-name",
      label: "Employee Name",
      value: homeState.employeeName,
      queryParameterDefault: homeState.employeeName,
      handleChange: handleEmployeeChange,
      handleDelete: useCallback(() => {
        dispatch({ type: "SET_EMPLOYEE_NAME", payload: "" });
      }, [dispatch]),
    },
    {
      type: "select-list",
      queryParameterName: "status",
      label: "Employee Status",
      value: homeState.status,
      data: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
        { label: "Suspended", value: "Suspended" },
        { label: "Left", value: "Left" },
      ],
      queryParameterDefault: homeState.status,
      handleChange: handleStatusChange,
      handleDelete: handleStatusChange,
      shouldFilterComboBox: true,
      isMultiComboBox: true,
    },
  ];
  const buttons = [
    {
      title: "prev-week",
      handleClick: handleprevWeek,
      icon: ChevronLeft,
    },
    {
      title: "next-week",
      handleClick: handlenextWeek,
      icon: ChevronRight,
    },
  ];
  return <ListViewHeader filters={filters} buttons={buttons} showFilterValue />;
};
