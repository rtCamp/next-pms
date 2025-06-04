/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { ButtonProps, useToast } from "@next-pms/design-system/components";
import { getFormatedDate } from "@next-pms/design-system/date";
import { useQueryParam } from "@next-pms/hooks";
import { addDays } from "date-fns";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import _ from "lodash";
import { ChevronLeftIcon, ChevronRight, Plus } from "lucide-react";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { Header } from "@/app/components/list-view/header";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { ViewData } from "@/store/view";
import SkillSearch from "./skillSearch";
import { ResourceFormContext } from "../../store/resourceFormContext";
import { TeamContext } from "../../store/teamContext";
import type { PermissionProps, Skill } from "../../store/types";

/**
 * This component is responsible for loading the team view header.
 *
 * @returns React.FC
 */
const ResourceTeamHeaderSection = ({ viewData }: { viewData: ViewData }) => {
  const [businessUnitParam] = useQueryParam<string[]>("business-unit", []);
  const [employeeNameParam] = useQueryParam<string>("employee-name", "");
  const [reportingNameParam] = useQueryParam<string>("reports-to", "");
  const [allocationTypeParam] = useQueryParam<string[]>("allocation-type", []);
  const [designationParam] = useQueryParam<string[]>("designation", []);
  const [viewParam, setViewParam] = useQueryParam<string>("view-type", viewData.filters.view || "");
  const [combineWeekHoursParam, setCombineWeekHoursParam] = useQueryParam<boolean>(
    "combine-week-hours",
    viewData.filters.combineWeekHours || false
  );
  const [skillSearchParam, setSkillSearchParam] = useQueryParam<Skill[]>("skill-search", []);
  const { toast } = useToast();

  const { teamData, filters, tableView, hasViewUpdated } = useContextSelector(TeamContext, (value) => value.state);

  const { updateFilter, setWeekDate, setCombineWeekHours, updateTableView, setHasViewUpdated } = useContextSelector(
    TeamContext,
    (value) => value.actions
  );

  const { permission: resourceAllocationPermission } = useContextSelector(ResourceFormContext, (value) => value.state);

  const { updatePermission, updateDialogState } = useContextSelector(ResourceFormContext, (value) => value.actions);

  const { call, loading } = useFrappePostCall(
    "next_pms.resource_management.api.permission.get_user_resources_permissions"
  );

  const { data: employee } = useFrappeGetCall("next_pms.timesheet.api.employee.get_employee", {
    filters: { name: reportingNameParam },
  });

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
    let CurrentViewParam = viewParam;
    if (!CurrentViewParam) {
      CurrentViewParam = "planned-vs-capacity";
      if (resResourceAllocationPermission.write) {
        setViewParam(CurrentViewParam);
      }
    }
    updateFilter({
      businessUnit:
        businessUnitParam && businessUnitParam.length > 0 ? businessUnitParam : viewData.filters.businessUnit,
      employeeName: employeeNameParam || viewData.filters.employeeName,
      reportingManager: reportingNameParam || viewData.filters.reportingManager,
      designation: designationParam && designationParam.length > 0 ? designationParam : viewData.filters.designation,
      allocationType:
        allocationTypeParam && allocationTypeParam.length > 0 ? allocationTypeParam : viewData.filters.allocationType,
      skillSearch: skillSearchParam && skillSearchParam.length > 0 ? skillSearchParam : viewData.filters.skillSearch,
    });

    updateTableView({ ...tableView, view: CurrentViewParam, combineWeekHours: combineWeekHoursParam });
  };

  const handleWeekViewChange = useCallback(() => {
    setCombineWeekHoursParam(!tableView.combineWeekHours);
    setCombineWeekHours(!tableView.combineWeekHours);
  }, [setCombineWeekHours, setCombineWeekHoursParam, tableView.combineWeekHours]);

  const handlePrevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(teamData.dates[0].start_date, -3));
    setWeekDate(date);
  }, [setWeekDate, teamData.dates]);

  const handleNextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(teamData.dates[0].end_date, +7));
    setWeekDate(date);
  }, [setWeekDate, teamData.dates]);

  // frappe-call for updating view
  const { call: updateView } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view"
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { start, weekDate, employeeWeekDate, maxWeek, pageLength, ...viewFilters } = filters;
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

  // Handle save changes
  const handleSaveChanges = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { start, weekDate, employeeWeekDate, maxWeek, pageLength, ...viewFilters } = filters;
    updateView({
      view: {
        ...viewData,
        filters: { ...viewFilters, view: tableView.view, combineWeekHours: tableView.combineWeekHours },
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

  return (
    <Header
      filters={[
        {
          queryParameterName: "employee-name",
          handleChange: (value: string) => {
            updateFilter({ employeeName: value });
          },
          handleDelete: () => {
            updateFilter({ employeeName: "" });
          },
          type: "search",
          value: filters.employeeName,
          defaultValue: "",
          label: "Employee Name",
          queryParameterDefault: "",
        },
        {
          queryParameterName: "reports-to",
          handleChange: (value: string | string[]) => {
            updateFilter({ reportingManager: value as string });
          },
          handleDelete: () => {
            updateFilter({ reportingManager: "" });
          },
          type: "search-employee",
          value: filters.reportingManager,
          defaultValue: "",
          label: "Reporting Manager",
          hide: !resourceAllocationPermission.write,
          queryParameterDefault: [],
          className: "z-100",
          employeeName: employee?.message?.employee_name,
        },
        {
          type: "custom-filter",
          queryParameterDefault: [],
          label: "Skill",
          handleDelete: (value: string[]) => {
            let prev_data = filters?.skillSearch;
            const operators = [">", "<", ">=", "<=", "="];
            const skills = value.map((value) => {
              // Iterate through each value and extract skill name
              for (const operator of operators) {
                if (value.includes(` ${operator} `)) {
                  return value.split(` ${operator} `)[0].trim();
                }
              }
              return value.trim();
            });
            prev_data = prev_data!.filter((obj) => skills.includes(obj.name));
            updateFilter({ skillSearch: prev_data });
          },
          value: filters.skillSearch?.map((obj) => obj.name + " " + obj.operator + " " + obj.proficiency * 5),
          hide: !resourceAllocationPermission.write,
          customFilterComponent: (
            <SkillSearch
              onSubmit={(skills) => {
                updateFilter({ skillSearch: skills });
              }}
              setSkillSearchParam={setSkillSearchParam}
              skillSearch={filters?.skillSearch || []}
            />
          ),
        },
        {
          queryParameterName: "business-unit",
          handleChange: (value: string | string[]) => {
            updateFilter({ businessUnit: value as string[] });
          },
          handleDelete: (value: string[] | undefined) => {
            updateFilter({ businessUnit: value });
          },
          type: "select-search",
          value: filters.businessUnit,
          label: "Business Unit",
          shouldFilterComboBox: true,
          isMultiComboBox: true,
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
          queryParameterDefault: filters.businessUnit,
        },
        {
          queryParameterName: "designation",
          handleChange: (value: string | string[]) => {
            updateFilter({ designation: value as string[] });
          },
          handleDelete: (value: string[] | undefined) => {
            updateFilter({ designation: value });
          },
          type: "select-search",
          value: filters.designation,
          shouldFilterComboBox: true,
          isMultiComboBox: true,
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
          queryParameterDefault: filters.designation,
        },
        {
          queryParameterName: "allocation-type",
          handleChange: (value: string | string[]) => {
            updateFilter({ allocationType: value as string[] });
          },
          handleDelete: (value: string[] | undefined) => {
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
          value: tableView.combineWeekHours,
          defaultValue: false,
          label: "Combine Week Hours",
          queryParameterDefault: false,
        },
      ]}
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
      showFilterValue
    />
  );
};

export { ResourceTeamHeaderSection };
