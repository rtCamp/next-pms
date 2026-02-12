/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { ButtonProps, useToast } from "@next-pms/design-system/components";
import { getFormatedDate } from "@next-pms/design-system/date";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappePostCall } from "frappe-react-sdk";
import _ from "lodash";
import { ChevronLeftIcon, ChevronRight, Plus } from "lucide-react";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { Header } from "@/app/components/list-view/header";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { ViewData } from "@/store/view";
import { ProjectContext } from "../../store/projectContext";
import { ResourceFormContext } from "../../store/resourceFormContext";
import type { PermissionProps } from "../../store/types";

/**
 * This component is responsible for loading the project view header.
 *
 * @returns React.FC
 */
const ResourceProjectHeaderSection = ({ viewData }: { viewData: ViewData }) => {
  const [projectNameParam] = useQueryParam<string>("project-name", "");
  const [combineWeekHoursParam, setCombineWeekHoursParam] =
    useQueryParam<boolean>(
      "combine-week-hours",
      viewData.filters.combineWeekHours || false,
    );
  const [reportingNameParam] = useQueryParam<string>("reports-to", "");
  const [customerNameParam] = useQueryParam<string[]>("customer", []);
  const [allocationTypeParam] = useQueryParam<string[]>("allocation-type", []);
  const [billingType, setBillingTypeParam] = useQueryParam<string[]>(
    "billing-type",
    [],
  );
  const [viewParam, setViewParam] = useQueryParam<string>(
    "view-type",
    viewData.filters.view || "",
  );
  const { toast } = useToast();

  const { projectData, tableView, filters, hasViewUpdated } =
    useContextSelector(ProjectContext, (value) => value.state);

  const {
    updateFilter,
    updateTableView,
    setWeekDate,
    setCombineWeekHours,
    setHasViewUpdated,
  } = useContextSelector(ProjectContext, (value) => value.actions);
  const user = useSelector((state: RootState) => state.user);
  const { permission: resourceAllocationPermission } = useContextSelector(
    ResourceFormContext,
    (value) => value.state,
  );

  const { updatePermission, updateDialogState } = useContextSelector(
    ResourceFormContext,
    (value) => value.actions,
  );

  const { call, loading } = useFrappePostCall(
    "next_pms.resource_management.api.permission.get_user_resources_permissions",
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
        currentBillingType = viewData.filters.billingType
          ? viewData.filters.billingType
          : ["Retainer", "Fixed Cost", "Time and Material"];
        setBillingTypeParam(currentBillingType);
      }
    }
    updateFilter({
      projectName: projectNameParam || viewData.filters.projectName,
      customer:
        customerNameParam && customerNameParam.length > 0
          ? customerNameParam
          : viewData.filters.customer,
      reportingManager: reportingNameParam || viewData.filters.reportingManager,
      allocationType:
        allocationTypeParam && allocationTypeParam.length > 0
          ? allocationTypeParam
          : viewData.filters.allocationType,
      billingType: currentBillingType,
    });
    updateTableView({
      ...tableView,
      combineWeekHours: combineWeekHoursParam,
      view: currentViewParam,
    });
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
  }, [
    setCombineWeekHours,
    setCombineWeekHoursParam,
    tableView.combineWeekHours,
  ]);

  const { call: updateView } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view",
  );

  useEffect(() => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      start: _unused1,
      weekDate: _unused2,
      employeeWeekDate: _unused3,
      maxWeek: _unused4,
      pageLength: _unused5,
      ...viewFilters
    } = filters;
    /* eslint-enable @typescript-eslint/no-unused-vars */

    if (
      !_.isEqual(viewData.filters, {
        ...viewFilters,
        view: tableView.view,
        combineWeekHours: tableView.combineWeekHours,
      })
    ) {
      setHasViewUpdated(true);
    } else {
      setHasViewUpdated(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, viewData, tableView.view, tableView.combineWeekHours]);

  const handleSaveChanges = () => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      start: _unused1,
      weekDate: _unused2,
      employeeWeekDate: _unused3,
      maxWeek: _unused4,
      pageLength: _unused5,
      ...viewFilters
    } = filters;
    /* eslint-enable @typescript-eslint/no-unused-vars */
    updateView({
      view: {
        ...viewData,
        filters: {
          ...viewFilters,
          view: tableView.view,
          combineWeekHours: tableView.combineWeekHours,
        },
      },
    })
      .then(() => {
        toast({
          variant: "success",
          description: "View Updated",
        });
        setHasViewUpdated(false);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };
  let sectionFilters = [
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
  ];
  if (!user.hasBuField) {
    sectionFilters = sectionFilters.filter(
      (filter) => filter.queryParameterName !== "business-unit",
    );
  }
  return (
    <Header
      filters={sectionFilters}
      buttons={[
        {
          title: "Save changes",
          handleClick: () => {
            handleSaveChanges();
          },
          hide: !hasViewUpdated,
          label: "Save changes",
          variant: "ghost" as ButtonProps["variant"],
          className: "h-10 px-2 py-2",
        },
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
          icon: () => (
            <ChevronLeftIcon className="w-4 max-md:w-3 h-4 max-md:h-3" />
          ),
        },
        {
          title: "next-week",
          handleClick: handleNextWeek,
          icon: () => (
            <ChevronRight className="w-4 max-md:w-3 h-4 max-md:h-3" />
          ),
        },
      ]}
      showFilterValue
    />
  );
};

export { ResourceProjectHeaderSection };
