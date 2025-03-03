/**
 * External dependencies.
 */
import { useCallback, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFormatedDate } from "@next-pms/design-system/date";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappePostCall } from "frappe-react-sdk";
import { ChevronLeftIcon, ChevronRight, Plus } from "lucide-react";
/**
 * Internal dependencies.
 */
import { Header } from "@/app/components/list-view/header";
import { RootState } from "@/store";
import {
  deleteFilters,
  setAllocationType,
  setBillingType,
  setCombineWeekHours,
  setCustomer,
  setFilters,
  setProjectName,
  setView,
  setWeekDate,
} from "@/store/resource_management/project";
import { ResourceFormContext } from "../../store/resourceFormContext";
import { PermissionProps } from "../../store/types";

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

  const resourceProjectState = useSelector((state: RootState) => state.resource_project);
  const resourceProjectStateTableView = resourceProjectState.tableView;

  const {
    permission: resourceAllocationPermission,
    updatePermission,
    updateDialogState,
  } = useContext(ResourceFormContext);
  const dispatch = useDispatch();

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
    dispatch(
      setFilters({
        projectName: projectNameParam,
        customer: customerNameParam,
        reportingManager: reportingNameParam,
        allocationType: allocationTypeParam,
        view: currentViewParam,
        combineWeekHours: combineWeekHoursParam,
        billingType: currentBillingType,
      })
    );
  };

  const handlePrevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceProjectState.data.dates[0].start_date, -3));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceProjectState.data.dates]);

  const handleNextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceProjectState.data.dates[0].end_date, +1));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceProjectState.data.dates]);

  const handleWeekViewChange = useCallback(() => {
    setCombineWeekHoursParam(!resourceProjectStateTableView.combineWeekHours);
    dispatch(setCombineWeekHours(!resourceProjectStateTableView.combineWeekHours));
  }, [dispatch, resourceProjectStateTableView.combineWeekHours, setCombineWeekHoursParam]);

  return (
    <Header
      filters={[
        {
          queryParameterName: "project-name",
          handleChange: (value: string) => {
            dispatch(setProjectName(value));
          },
          handleDelete: () => {
            dispatch(deleteFilters({ projectName: "", type: "project" }));
          },
          type: "search",
          value: resourceProjectState.projectName,
          defaultValue: "",
          label: "Project Name",
          queryParameterDefault: "",
        },
        {
          queryParameterName: "customer",
          handleChange: (value: string | string[]) => {
            dispatch(setCustomer(value as string[]));
          },
          handleDelete: (value: string[]) => {
            dispatch(deleteFilters({ customer: value, type: "customer" }));
          },
          type: "select-search",
          value: resourceProjectState.customer,
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
          queryParameterDefault: resourceProjectState.customer,
        },
        {
          type: "select-list",
          queryParameterName: "billing-type",
          label: "Billing Type",
          value: resourceProjectState.billingType,
          data: [
            { label: "Non-Billable", value: "Non-Billable" },
            { label: "Retainer", value: "Retainer" },
            { label: "Fixed Cost", value: "Fixed Cost" },
            { label: "Time and Material", value: "Time and Material" },
          ],
          queryParameterDefault: resourceProjectState.billingType,
          handleChange: (value: string | string[]) => {
            dispatch(setBillingType(value as string[]));
          },
          handleDelete: (value: string[]) => {
            dispatch(deleteFilters({ billingType: value, type: "billing-type" }));
          },
          shouldFilterComboBox: true,
          isMultiComboBox: true,
          hide: !resourceAllocationPermission.write,
        },
        {
          queryParameterName: "allocation-type",
          handleChange: (value: string | string[]) => {
            dispatch(setAllocationType(value as string[]));
          },
          handleDelete: (value: string[]) => {
            dispatch(deleteFilters({ allocationType: value, type: "allocation-type" }));
          },
          type: "select-list",
          value: resourceProjectState.allocationType,
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
          queryParameterDefault: resourceProjectState.allocationType,
          hide: !resourceAllocationPermission.write,
        },
        {
          queryParameterName: "view-type",
          handleChange: (value: string) => {
            dispatch(setView(value));
          },
          type: "select",
          value: resourceProjectStateTableView.view,
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
          value: resourceProjectStateTableView.combineWeekHours,
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
