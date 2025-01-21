/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappeGetCall } from "frappe-react-sdk";
import { ChevronLeft, ChevronRight } from "lucide-react";
/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/list-view/header";
import { getFormatedDate } from "@/lib/utils";
import { RootState } from "@/store";
import {
  setEmployeeName,
  setFilters,
  setProject,
  setReportsTo,
  setStatus,
  setStatusFilter,
  setUsergroup,
  setWeekDate,
} from "@/store/team";

export const Header = () => {
  const [projectSearch, setProjectSeach] = useState<string>("");
  const [userGroupSearch, setUserGroupSearch] = useState<string>("");
  const teamState = useSelector((state: RootState) => state.team);
  const [projectParam] = useQueryParam<string[]>("project", []);
  const [userGroupParam] = useQueryParam<string[]>("user-group", []);
  const [statusParam] = useQueryParam<string[]>("status", []);
  const [employeeNameParam] = useQueryParam<string>("employee-name", "");
  const [reportsToParam] = useQueryParam<string>("reports-to", "");
  const [employeeStatusParam] = useQueryParam<Array<string>>("emp-status", ["Active"]);
  const dispatch = useDispatch();
  const { data: employee } = useFrappeGetCall("next_pms.timesheet.api.employee.get_employee", {
    filters: { name: reportsToParam },
  });
  useEffect(() => {
    const payload = {
      project: projectParam,
      userGroup: userGroupParam,
      statusFilter: statusParam,
      employeeName: employeeNameParam,
      reportsTo: reportsToParam,
      status: employeeStatusParam,
    };
    dispatch(setFilters(payload));
  }, [dispatch, employeeNameParam, employeeStatusParam, projectParam, reportsToParam, statusParam, userGroupParam]);

  const handleEmployeeChange = useCallback(
    (text: string) => {
      dispatch(setEmployeeName(text.trim()));
    },
    [dispatch]
  );
  const handleReportsToChange = useCallback(
    (value: string | string[]) => {
      dispatch(setReportsTo(value as string));
    },
    [dispatch]
  );
  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setStatusFilter(normalizedFilters));
    },

    [dispatch]
  );
  const handleEmployeeStatusChange = useCallback(
    (value: string | string[]) => {
      dispatch(setStatus(value as string[]));
    },
    [dispatch]
  );
  const handleProjectChange = useCallback(
    (value: string | string[]) => {
      dispatch(setProject(value as string[]));
    },
    [dispatch]
  );
  const handleUserGroupChange = useCallback(
    (value: string | string[]) => {
      dispatch(setUsergroup(value as string[]));
    },
    [dispatch]
  );
  const handleprevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(teamState.weekDate, -7));
    dispatch(setWeekDate(date));
  }, [dispatch, teamState.weekDate]);

  const handlenextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(teamState.weekDate, 7));
    dispatch(setWeekDate(date));
  }, [dispatch, teamState.weekDate]);

  const filters = [
    {
      type: "search",
      queryParameterName: "employee-name",
      label: "Employee Name",
      defaultValue: "",
      value: teamState.employeeName,
      queryParameterDefault: teamState.employeeName,
      handleChange: handleEmployeeChange,
      handleDelete: useCallback(() => {
        dispatch(setEmployeeName(""));
      }, [dispatch]),
    },
    {
      type: "search-employee",
      queryParameterName: "reports-to",
      handleChange: handleReportsToChange,
      handleDelete: useCallback(() => {
        dispatch(setReportsTo(""));
      }, [dispatch]),
      value: teamState.reportsTo,
      label: "Reports To",
      employeeName: employee?.message?.employee_name,
      queryParameterDefault: "",
    },
    {
      type: "select-list",
      data: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
        { label: "Suspended", value: "Suspended" },
        { label: "Left", value: "Left" },
      ],
      label: "Employee Status",
      queryParameterName: "emp-status",
      value: teamState.status,
      queryParameterDefault: teamState.status,
      handleChange: handleEmployeeStatusChange,
      handleDelete: handleEmployeeStatusChange,
    },
    {
      type: "select-list",
      data: [
        { label: "Not Submitted", value: "Not Submitted" },
        { label: "Approval Pending", value: "Approval Pending" },
        { label: "Approved", value: "Approved" },
        { label: "Rejected", value: "Rejected" },
        { label: "Partially Approved", value: "Partially Approved" },
        { label: "Partially Rejected", value: "Partially Rejected" },
      ],
      label: "Approval Status",
      queryParameterName: "status",
      value: teamState.statusFilter,
      queryParameterDefault: teamState.statusFilter,
      handleChange: handleStatusChange,
      handleDelete: handleStatusChange,
      isMultiComboBox: true,
      shouldFilterComboBox: true,
    },
    {
      type: "select-search",
      queryParameterName: "project",
      label: "Project",
      value: teamState.project,
      queryParameterDefault: teamState.project,
      apiCall: {
        url: "frappe.client.get_list",
        filters: {
          doctype: "Project",
          fields: ["name", "project_name as label"],
          or_filters: [
            ["name", "like", `%${projectSearch}%`],
            ["project_name", "like", `%${projectSearch}%`],
          ],
        },
        options: {
          revalidateOnFocus: false,
          revalidateIfStale: false,
        },
      },
      onComboSearch: (searchTerm: string) => {
        setProjectSeach(searchTerm);
      },
      shouldFilterComboBox: false,
      isMultiComboBox: true,
      handleChange: handleProjectChange,
      handleDelete: handleProjectChange,
    },
    {
      type: "select-search",
      queryParameterName: "user-group",
      label: "User Group",
      value: teamState.userGroup,
      queryParameterDefault: teamState.userGroup,
      apiCall: {
        url: "frappe.client.get_list",
        filters: {
          doctype: "User Group",
          fields: ["name"],
          or_filters: [["name", "like", `%${userGroupSearch}%`]],
        },
        options: {
          revalidateOnFocus: false,
          revalidateIfStale: false,
        },
      },
      onComboSearch: (searchTerm: string) => {
        setUserGroupSearch(searchTerm);
      },
      shouldFilterComboBox: false,
      isMultiComboBox: true,
      handleChange: handleUserGroupChange,
      handleDelete: handleUserGroupChange,
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
