/**
 * External dependencies
 */
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addDays } from "date-fns";
import { ChevronRight, ChevronLeft } from "lucide-react";
/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/listview/header";
import { useQueryParamsState } from "@/lib/queryParam";
import { getFormatedDate } from "@/lib/utils";
import { RootState } from "@/store";
import { resetState, setEmployeeName, setFilters, setStatus, setWeekDate } from "@/store/home";

export const Header = () => {
  const homeState = useSelector((state: RootState) => state.home);
  const dispatch = useDispatch();
  const [employeeNameParam] = useQueryParamsState<string>("employee-name", "");
  const [employeeStatusParam] = useQueryParamsState<Array<string>>("status", ["Active"]);

  useEffect(() => {
    const payload = {
      employeeName: employeeNameParam,
      status: employeeStatusParam,
    };
    dispatch(setFilters(payload));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEmployeeChange = useCallback(
    (text: string) => {
      dispatch(setEmployeeName(text.trim()));
    },
    [dispatch]
  );

  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setStatus(normalizedFilters));
    },

    [dispatch]
  );

  const handleprevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(homeState.weekDate, -14));
    dispatch(setWeekDate(date));
  }, [dispatch, homeState.weekDate]);

  const handlenextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(homeState.weekDate, 14));
    dispatch(setWeekDate(date));
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
        dispatch(setEmployeeName(""));
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
