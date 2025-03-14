/**
 * External dependencies.
 */
import { useCallback, useContext, useEffect } from "react";
import { getFormatedDate } from "@next-pms/design-system/date";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappePostCall } from "frappe-react-sdk";
import { ChevronLeftIcon, ChevronRight, Plus } from "lucide-react";
/**
 * Internal dependencies.
 */
import { Header } from "@/app/components/list-view/header";
import { ProjectContext } from "../../store/projectContext";
import { ResourceFormContext } from "../../store/resourceFormContext";
import type { PermissionProps } from "../../store/types";

/**
 * This component is responsible for loading the project view header.
 *
 * @returns React.FC
 */
const ResourceProjectHeaderSection = () => {
  const [projectNameParam] = useQueryParam<string>("project-name", "");
  const [combineWeekHoursParam, setCombineWeekHoursParam] = useQueryParam<boolean>("combine-week-hours", false);
  const [reportingNameParam] = useQueryParam<string>("reports-to", "");
  const [customerNameParam] = useQueryParam<string[]>("customer", []);
  const [allocationTypeParam] = useQueryParam<string[]>("allocation-type", []);
  const [billingType, setBillingTypeParam] = useQueryParam<string[]>("billing-type", []);
  const [viewParam, setViewParam] = useQueryParam<string>("view-type", "");

  const { projectData, tableView, filters, updateFilter, updateTableView, setWeekDate, setCombineWeekHours } =
    useContext(ProjectContext);

  const {
    permission: resourceAllocationPermission,
    updatePermission,
    updateDialogState,
  } = useContext(ResourceFormContext);

  const { call, loading } = useFrappePostCall(
    "next_pms.resource_management.api.permission.get_user_resources_permissions"
  );

  useEffect(() => {
    if (!resourceAllocationPermission.isNeedToSetPermission) {
      updateFilters(resourceAllocationPermission);
      return;
    }
    if (loading) return;

    call({}).then((res: { message: PermissionProps }) => {
      const resResourceAllocationPermission = res.message;
      updateFilters(resResourceAllocationPermission);
      updatePermission(resResourceAllocationPermission);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFilters = (resResourceAllocationPermission: PermissionProps) => {
    let currentViewParam = viewParam;
    if (!currentViewParam) {
      currentViewParam = "planned";
      if (resResourceAllocationPermission.write) {
        setViewParam(currentViewParam);
      }
    }
    let currentBillingType = billingType;
    if (resResourceAllocationPermission.write) {
      if (!billingType || billingType.length == 0) {
        currentBillingType = ["Retainer", "Fixed Cost", "Time and Material"];
        setBillingTypeParam(currentBillingType);
      }
    }
    updateFilter({
      projectName: projectNameParam,
      customer: customerNameParam,
      reportingManager: reportingNameParam,
      allocationType: allocationTypeParam,
      billingType: currentBillingType,
    });
    updateTableView({ ...tableView, combineWeekHours: combineWeekHoursParam, view: currentViewParam });
  };

  const handlePrevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(projectData.dates[0].start_date, -3));
    setWeekDate(date);
  }, [projectData.dates, setWeekDate]);

  const handleNextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(projectData.dates[0].end_date, +1));
    setWeekDate(date);
  }, [projectData.dates, setWeekDate]);

  const handleWeekViewChange = useCallback(() => {
    setCombineWeekHoursParam(!tableView.combineWeekHours);
    setCombineWeekHours(!tableView.combineWeekHours);
  }, [setCombineWeekHours, setCombineWeekHoursParam, tableView.combineWeekHours]);

  return (
    <Header
      filters={[
        {
          queryParameterName: "project-name",
          handleChange: (value: string) => {
            updateFilter({ projectName: value });
          },
          handleDelete: () => {
            updateFilter({ projectName: "" });
          },
          type: "search",
          value: filters.projectName,
          defaultValue: "",
          label: "Project Name",
          queryParameterDefault: "",
        },
        {
          queryParameterName: "customer",
          handleChange: (value: string | string[]) => {
            updateFilter({ customer: value as string[] });
          },
          handleDelete: (value: string[]) => {
            updateFilter({ customer: value });
          },
          type: "select-search",
          value: filters.customer,
          label: "Customer",
          shouldFilterComboBox: true,
          isMultiComboBox: true,
          hide: !resourceAllocationPermission.write,
          apiCall: {
            url: "frappe.client.get_list",
            filters: {
              doctype: "Customer",
              fields: ["name"],
              limit_page_length: 0,
            },
            options: {
              revalidateOnFocus: false,
              revalidateIfStale: false,
            },
          },
          queryParameterDefault: filters.customer,
        },
        {
          type: "select-list",
          queryParameterName: "billing-type",
          label: "Billing Type",
          value: filters.billingType,
          data: [
            { label: "Non-Billable", value: "Non-Billable" },
            { label: "Retainer", value: "Retainer" },
            { label: "Fixed Cost", value: "Fixed Cost" },
            { label: "Time and Material", value: "Time and Material" },
          ],
          queryParameterDefault: filters.billingType,
          handleChange: (value: string | string[]) => {
            updateFilter({ billingType: value as string[] });
          },
          handleDelete: (value: string[]) => {
            updateFilter({ billingType: value });
          },
          shouldFilterComboBox: true,
          isMultiComboBox: true,
          hide: !resourceAllocationPermission.write,
        },
        {
          queryParameterName: "allocation-type",
          handleChange: (value: string | string[]) => {
            updateFilter({ allocationType: value as string[] });
          },
          handleDelete: (value: string[]) => {
            updateFilter({ allocationType: value });
          },
          type: "select-list",
          value: filters.allocationType,
          shouldFilterComboBox: true,
          isMultiComboBox: true,
          label: "Allocation Type",
          data: [
            {
              label: "Billable",
              value: "Billable",
            },
            {
              label: "Non-Billable",
              value: "Non-Billable",
            },
          ],
          queryParameterDefault: filters.allocationType,
          hide: !resourceAllocationPermission.write,
        },
        {
          queryParameterName: "view-type",
          handleChange: (value: string) => {
            updateTableView({ ...tableView, view: value });
          },
          type: "select",
          value: tableView.view,
          defaultValue: "planned",
          label: "Views",
          data: [
            {
              label: "Planned",
              value: "planned",
            },
            {
              label: "Actual vs Planned",
              value: "actual-vs-planned",
            },
          ],
          hide: !resourceAllocationPermission.write,
          queryParameterDefault: "planned",
        },
        {
          queryParameterName: "combine-week-hours",
          handleChange: handleWeekViewChange,
          type: "checkbox",
          value: tableView.combineWeekHours,
          defaultValue: false,
          label: "Combine Week Hours",
          queryParameterDefault: false,
        },
      ]}
      buttons={[
        {
          title: "add-allocation",
          handleClick: () => {
            updateDialogState({ isShowDialog: true, isNeedToEdit: false });
          },
          className: "px-3",
          icon: () => <Plus className="w-4 max-md:w-3 h-4 max-md:h-3" />,
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
      showFilterValue
    />
  );
};

export { ResourceProjectHeaderSection };
