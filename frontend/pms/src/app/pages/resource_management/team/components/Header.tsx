import {
  setWeekDate,
  setEmployeeName,
  setBusinessUnit,
  setFilters,
  resetState,
  setCombineWeekHours,
  setView,
  setAllocationType,
  setDesignation,
  setReportingManager,
  deleteFilters,
} from "@/store/resource_management/team";
import { getFormatedDate } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import { addDays } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQueryParamsState } from "@/lib/queryParam";
import { ResourceHeaderSection } from "../../components/Header";
import { ChevronLeftIcon, ChevronRight, Plus } from "lucide-react";
import { PermissionProps, setDialog } from "@/store/resource_management/allocation";

const ResourceTeamHeaderSection = () => {
  const [businessUnitParam] = useQueryParamsState<string[]>("business-unit", []);
  const [employeeNameParam] = useQueryParamsState<string>("employee-name", "");
  const [reportingNameParam] = useQueryParamsState<string>("reports-to", "");
  const [allocationTypeParam] = useQueryParamsState<string[]>("allocation-type", []);
  const [designationParam] = useQueryParamsState<string[]>("designation", []);
  const [viewParam, setViewParam] = useQueryParamsState<string>("view-type", "");
  const [combineWeekHoursParam, setCombineWeekHoursParam] = useQueryParamsState<boolean>("combine-week-hours", false);

  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const resourceTeamStateTableView = resourceTeamState.tableView;
  const dispatch = useDispatch();
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  useEffect(() => {
    let CurrentViewParam = viewParam;
    if (!CurrentViewParam) {
      CurrentViewParam = "planned-vs-capacity";
      if (resourceAllocationPermission.write) {
        setViewParam(CurrentViewParam);
      }
    }

    dispatch(
      setFilters({
        businessUnit: businessUnitParam,
        employeeName: employeeNameParam,
        reportingManager: reportingNameParam,
        designation: designationParam,
        allocationType: allocationTypeParam,
        view: CurrentViewParam,
        combineWeekHours: combineWeekHoursParam,
      })
    );
    return () => {
      dispatch(resetState());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleWeekViewChange = useCallback(() => {
    setCombineWeekHoursParam(!resourceTeamStateTableView.combineWeekHours);
    dispatch(setCombineWeekHours(!resourceTeamStateTableView.combineWeekHours));
  }, [dispatch, resourceTeamStateTableView.combineWeekHours, setCombineWeekHoursParam]);

  const handlePrevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].start_date, -3));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  const handleNextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].end_date, +1));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  return (
    <ResourceHeaderSection
      filters={[
        {
          queryParameterName: "employee-name",
          handleChange: (value: string) => {
            dispatch(setEmployeeName(value));
          },
          handleDelete: (value: string) => {
            dispatch(deleteFilters({ type: "employee", employeeName: "" }));
          },
          type: "search",
          value: resourceTeamState.employeeName,
          defaultValue: "",
          label: "Employee Name",
          queryParameterDefault: "",
        },
        {
          queryParameterName: "reports-to",
          handleChange: (value: string | string[]) => {
            dispatch(setReportingManager(value as string));
          },
          handleDelete: (value: string[] | undefined) => {
            dispatch(deleteFilters({ type: "repots-to", reportingManager: "" }));
          },
          type: "search-employee",
          value: resourceTeamState.reportingManager,
          defaultValue: "",
          label: "Reporting Manager",
          hide: !resourceAllocationPermission.write,
          queryParameterDefault: [],
        },
        {
          queryParameterName: "business-unit",
          handleChange: (value: string | string[]) => {
            dispatch(setBusinessUnit(value as string[]));
          },
          handleDelete: (value: string[] | undefined) => {
            console.log({ type: "business-unit", businessUnit: value });
            dispatch(deleteFilters({ type: "business-unit", businessUnit: value }));
          },
          type: "select-search",
          value: resourceTeamState.businessUnit,
          defaultValue: "",
          label: "Business Unit",
          hide: !resourceAllocationPermission.write,
          apiCall: {
            url: "frappe.client.get_list",
            filters: {
              doctype: "Business Unit",
              fields: ["name"],
              limit_page_length: 0,
            },
            options: {
              revalidateOnFocus: false,
              revalidateIfStale: false,
            },
          },
          queryParameterDefault: [],
        },
        {
          queryParameterName: "designation",
          handleChange: (value: string | string[]) => {
            dispatch(setDesignation(value as string[]));
          },
          handleDelete: (value: string[] | undefined) => {
            dispatch(deleteFilters({ type: "designation", designation: value }));
          },
          type: "select-search",
          value: resourceTeamState.designation,
          defaultValue: "",
          label: "Designation",
          hide: !resourceAllocationPermission.write,
          apiCall: {
            url: "frappe.client.get_list",
            filters: {
              doctype: "Designation",
              filter: { custom_enabled: true },
              fields: ["name"],
              limit_page_length: 0,
            },
            options: {
              revalidateOnFocus: false,
              revalidateIfStale: false,
            },
          },
          queryParameterDefault: [],
        },
        {
          queryParameterName: "allocation-type",
          handleChange: (value: string | string[]) => {
            dispatch(setAllocationType(value as string[]));
          },
          handleDelete: (value: string[] | undefined) => {
            dispatch(deleteFilters({ type: "allocation-type", allocationType: value }));
          },
          type: "select-list",
          value: resourceTeamState.allocationType,
          defaultValue: "",
          label: "Allocation Type",
          data: [
            {
              label: "Billable",
              value: "billable",
            },
            {
              label: "Non-Billable",
              value: "non-billable",
            },
          ],
          queryParameterDefault: "",
        },
        {
          queryParameterName: "view-type",
          handleChange: (value: string) => {
            dispatch(setView(value));
          },
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
          hide: !resourceAllocationPermission.write,
          queryParameterDefault: "planned-vs-capacity",
        },
        {
          queryParameterName: "combine-week-hours",
          handleChange: handleWeekViewChange,
          type: "checkbox",
          value: resourceTeamStateTableView.combineWeekHours,
          defaultValue: false,
          label: "Combine Week Hours",
          queryParameterDefault: false,
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
          hide: !resourceAllocationPermission.write,
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
