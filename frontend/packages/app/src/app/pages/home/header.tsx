/**
 * External dependencies
 */
import { useCallback, useEffect } from "react";
import { ButtonProps, useToast } from "@next-pms/design-system/components";
import { getFormatedDate } from "@next-pms/design-system/date";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappePostCall } from "frappe-react-sdk";
import _ from "lodash";
import { ChevronRight, ChevronLeft } from "lucide-react";
/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/list-view/header";
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { HeaderProps } from "./types";

export const Header = ({ homeState, dispatch, viewData }: HeaderProps) => {
  const [employeeNameParam] = useQueryParam<string>("employee-name", "");
  const [employeeStatusParam] = useQueryParam<Array<string>>("status", viewData.filters.status ?? []);
  const { toast } = useToast();

  useEffect(() => {
    const payload = {
      employeeName: employeeNameParam || viewData.filters.employeeName,
      status: employeeStatusParam && employeeStatusParam.length > 0 ? employeeStatusParam : viewData.filters.status,
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

  const { call: updateView } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view"
  );

  useEffect(() => {
    const viewFilters = { status: homeState.status, employeeName: homeState.employeeName };
    if (!_.isEqual(viewData.filters, viewFilters)) {
      dispatch({ type: "SET_HAS_VIEW_UPDATED", payload: true });
    } else {
      dispatch({ type: "SET_HAS_VIEW_UPDATED", payload: false });
    }
  }, [homeState.employeeName, homeState.status, viewData, dispatch]);

  const handleSaveChanges = () => {
    const viewFilters = { status: homeState.status, employeeName: homeState.employeeName };
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
      ]}
      buttons={[
        {
          title: "Save changes",
          handleClick: () => {
            handleSaveChanges();
          },
          hide: !homeState.hasViewUpdated,
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
