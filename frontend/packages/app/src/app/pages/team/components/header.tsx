/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from "react";
import { ButtonProps, useToast } from "@next-pms/design-system/components";
import { getFormatedDate } from "@next-pms/design-system/date";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import _ from "lodash";
import { ChevronLeft, ChevronRight } from "lucide-react";
/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/list-view/header";
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { HeaderProps } from "./types";

export const Header = ({ teamState, dispatch, viewData }: HeaderProps) => {
  const [projectSearch, setProjectSeach] = useState<string>("");
  const [userGroupSearch, setUserGroupSearch] = useState<string>("");
  const [projectParam] = useQueryParam<string[]>("project", []);
  const [userGroupParam] = useQueryParam<string[]>("user-group", []);
  const [statusParam] = useQueryParam<string[]>("status", []);
  const [employeeNameParam] = useQueryParam<string>("employee-name", "");
  const [reportsToParam] = useQueryParam<string>("reports-to", "");
  const [employeeStatusParam] = useQueryParam<Array<string>>("emp-status", viewData.filters.status);
  const { data: employee } = useFrappeGetCall("next_pms.timesheet.api.employee.get_employee", {
    filters: { name: reportsToParam || viewData.filters.reportsTo },
  });
  const { toast } = useToast();
  useEffect(() => {
    const payload = {
      project: projectParam && projectParam.length > 0 ? projectParam : viewData.filters.project,
      userGroup: userGroupParam && userGroupParam.length > 0 ? userGroupParam : viewData.filters.userGroup,
      statusFilter: statusParam && statusParam.length > 0 ? statusParam : viewData.filters.statusFilter,
      employeeName: employeeNameParam || viewData.filters.employeeName,
      reportsTo: reportsToParam || viewData.filters.reportsTo,
      status: employeeStatusParam && employeeStatusParam.length > 0 ? employeeStatusParam : viewData.filters.status,
    };
    dispatch({ type: "SET_FILTERS", payload: payload });
  }, [
    dispatch,
    employeeNameParam,
    employeeStatusParam,
    projectParam,
    reportsToParam,
    statusParam,
    userGroupParam,
    viewData.filters,
  ]);

  const handleEmployeeChange = useCallback(
    (text: string) => {
      dispatch({ type: "SET_EMPLOYEE_NAME", payload: text.trim() });
    },
    [dispatch]
  );
  const handleReportsToChange = useCallback(
    (value: string | string[]) => {
      dispatch({ type: "SET_ACTION", payload: "SET" });
      dispatch({ type: "SET_REPORTS_TO", payload: value as string });
    },
    [dispatch]
  );
  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch({ type: "SET_STATUS_FILTER", payload: normalizedFilters });
    },

    [dispatch]
  );
  const handleEmployeeStatusChange = useCallback(
    (value: string | string[]) => {
      dispatch({ type: "SET_STATUS", payload: value as string[] });
    },
    [dispatch]
  );
  const handleProjectChange = useCallback(
    (value: string | string[]) => {
      dispatch({ type: "SET_PROJECT", payload: value as string[] });
    },
    [dispatch]
  );
  const handleUserGroupChange = useCallback(
    (value: string | string[]) => {
      dispatch({ type: "SET_USER_GROUP", payload: value as string[] });
    },
    [dispatch]
  );
  const handleprevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(teamState.weekDate, -7));
    dispatch({ type: "SET_WEEK_DATE", payload: date });
  }, [dispatch, teamState.weekDate]);

  const handlenextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(teamState.weekDate, 7));
    dispatch({ type: "SET_WEEK_DATE", payload: date });
  }, [dispatch, teamState.weekDate]);

  // frappe-call for updating view
  const { call: updateView } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view"
  );

  useEffect(() => {
    const viewFilters = {
      status: teamState.status,
      employeeName: teamState.employeeName,
      reportsTo: teamState.reportsTo,
      statusFilter: teamState.statusFilter,
      project: teamState.project,
      userGroup: teamState.userGroup,
    };
    // console.log(viewData.filters,"======",viewFilters)
    if (!_.isEqual(viewData.filters, viewFilters)) {
      dispatch({ type: "SET_HAS_VIEW_UPDATED", payload: true });
    } else {
      dispatch({ type: "SET_HAS_VIEW_UPDATED", payload: false });
    }
  }, [
    teamState.employeeName,
    teamState.status,
    teamState.reportsTo,
    teamState.statusFilter,
    teamState.project,
    teamState.userGroup,
    viewData,
    dispatch,
  ]);

  // Handle save changes
  const handleSaveChanges = () => {
    const viewFilters = {
      status: teamState.status,
      employeeName: teamState.employeeName,
      reportsTo: teamState.reportsTo,
      statusFilter: teamState.statusFilter,
      project: teamState.project,
      userGroup: teamState.userGroup,
    };
    updateView({
      view: { ...viewData, filters: viewFilters },
    })
      .then(() => {
        toast({
          variant: "success",
          description: "View Updated",
        });
        dispatch({ type: "SET_HAS_VIEW_UPDATED", payload: false });
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };

  return (
    <ListViewHeader
      filters={[
        {
          type: "search",
          queryParameterName: "employee-name",
          label: "Employee Name",
          defaultValue: "",
          value: teamState.employeeName,
          queryParameterDefault: teamState.employeeName,
          handleChange: handleEmployeeChange,
          handleDelete: useCallback(() => {
            dispatch({ type: "SET_EMPLOYEE_NAME", payload: "" });
          }, [dispatch]),
        },
        {
          type: "search-employee",
          queryParameterName: "reports-to",
          handleChange: handleReportsToChange,
          handleDelete: useCallback(() => {
            dispatch({ type: "SET_REPORTS_TO", payload: "" });
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
      ]}
      buttons={[
        {
          title: "Save changes",
          handleClick: () => {
            handleSaveChanges();
          },
          hide: !teamState.hasViewUpdated,
          label: "Save changes",
          variant: "ghost" as ButtonProps["variant"],
          className: "h-10 px-2 py-2",
        },
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
      ]}
      showFilterValue
    />
  );
};
