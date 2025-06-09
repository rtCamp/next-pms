/**
 * External dependencies.
 */
import { useEffect } from "react";
import { ButtonProps, useToast } from "@next-pms/design-system/components";
import { useQueryParam } from "@next-pms/hooks";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import _ from "lodash";
import { Plus, ZoomIn, ZoomOut } from "lucide-react";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { Header } from "@/app/components/list-view/header";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { ViewData } from "@/store/view";
import { ResourceFormContext } from "../../../store/resourceFormContext";
import { TimeLineContext } from "../../../store/timeLineContext";
import type { PermissionProps, Skill } from "../../../store/types";
import SkillSearch from "../../../team/components/skillSearch";

/**
 * This component is responsible for loading the team view header.
 *
 * @returns React.FC
 */
const ResourceTimLineHeaderSection = ({ viewData }: { viewData: ViewData }) => {
  const [businessUnitParam] = useQueryParam<string[]>("business-unit", []);
  const [employeeNameParam] = useQueryParam<string>("employee-name", "");
  const [reportingNameParam] = useQueryParam<string>("reports-to", "");
  const [allocationTypeParam] = useQueryParam<string[]>("allocation-type", []);
  const [designationParam] = useQueryParam<string[]>("designation", []);
  const [skillSearchParam, setSkillSearchParam] = useQueryParam<Skill[]>("skill-search", []);
  const { toast } = useToast();

  const { permission: resourceAllocationPermission } = useContextSelector(ResourceFormContext, (value) => value.state);

  const { updatePermission, updateDialogState } = useContextSelector(ResourceFormContext, (value) => value.actions);

  const { data: employee } = useFrappeGetCall("next_pms.timesheet.api.employee.get_employee", {
    filters: { name: reportingNameParam || viewData.filters.reportingManager },
  });

  const { filters, hasViewUpdated } = useContextSelector(TimeLineContext, (value) => value.state);
  const { updateFilters, setHasViewUpdated } = useContextSelector(TimeLineContext, (value) => value.actions);

  const { call, loading } = useFrappePostCall(
    "next_pms.resource_management.api.permission.get_user_resources_permissions"
  );

  const { call: updateView } = useFrappePostCall(
    "next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view"
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page_length, start, weekDate, ...viewFilters } = filters;
    if (!_.isEqual(viewData.filters, viewFilters)) {
      setHasViewUpdated(true);
    } else {
      setHasViewUpdated(false);
    }
  }, [filters, viewData]);

  const handleSaveChanges = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { page_length, start, weekDate, ...viewFilters } = filters;
    updateView({
      view: { ...viewData, filters: viewFilters },
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

  useEffect(() => {
    if (!resourceAllocationPermission.isNeedToSetPermission) {
      updateData();
      return;
    }
    if (loading) return;

    call({}).then((res: { message: PermissionProps }) => {
      const resResourceAllocationPermission = res.message;
      updatePermission(resResourceAllocationPermission);
      updateData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateData = () => {
    updateFilters({
      businessUnit:
        businessUnitParam && businessUnitParam.length > 0 ? businessUnitParam : viewData.filters.businessUnit,
      employeeName: employeeNameParam || viewData.filters.employeeName,
      reportingManager: reportingNameParam || viewData.filters.reportingManager,
      designation: designationParam && designationParam.length > 0 ? designationParam : viewData.filters.designation,
      allocationType:
        allocationTypeParam && allocationTypeParam.length > 0 ? allocationTypeParam : viewData.filters.allocationType,
      skillSearch: skillSearchParam && skillSearchParam.length > 0 ? skillSearchParam : viewData.filters.skillSearch,
      isShowMonth: viewData.filters.isShowMonth,
    });
  };

  return (
    <Header
      filters={[
        {
          queryParameterName: "employee-name",
          handleChange: (value: string) => {
            updateFilters({ employeeName: value });
          },
          handleDelete: () => {
            updateFilters({ employeeName: "" });
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
            updateFilters({ reportingManager: value as string });
          },
          handleDelete: () => {
            updateFilters({ reportingManager: "" });
          },
          type: "search-employee",
          value: filters.reportingManager,
          defaultValue: "",
          label: "Reporting Manager",
          hide: !resourceAllocationPermission.write,
          queryParameterDefault: [],
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
              for (const operator of operators) {
                if (value.includes(` ${operator} `)) {
                  return value.split(` ${operator} `)[0].trim();
                }
              }
              return value.trim();
            });
            prev_data = prev_data!.filter((obj) => skills.includes(obj.name));
            updateFilters({ skillSearch: prev_data });
          },
          value: filters.skillSearch?.map((obj) => obj.name + " " + obj.operator + " " + obj.proficiency * 5),
          hide: !resourceAllocationPermission.write,
          customFilterComponent: (
            <SkillSearch
              onSubmit={(skills) => {
                updateFilters({ skillSearch: skills });
              }}
              setSkillSearchParam={setSkillSearchParam}
              skillSearch={filters.skillSearch as Skill[]}
            />
          ),
        },
        {
          queryParameterName: "business-unit",
          handleChange: (value: string | string[]) => {
            updateFilters({ businessUnit: value as string[] });
          },
          handleDelete: (value: string[] | undefined) => {
            updateFilters({ businessUnit: value as string[] });
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
            updateFilters({ designation: value as string[] });
          },
          handleDelete: (value: string[] | undefined) => {
            updateFilters({ designation: value as string[] });
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
            updateFilters({ allocationType: value as string[] });
          },
          handleDelete: (value: string[] | undefined) => {
            updateFilters({ allocationType: value as string[] });
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
          title: "Zoom In",
          handleClick: () => {
            updateFilters({ isShowMonth: true });
          },
          className: "px-3",
          icon: () => <ZoomIn className="w-4 max-md:w-3 h-4 max-md:h-3 bg" />,
          variant: "outline",
          hide: !resourceAllocationPermission.write,
          disabled: filters.isShowMonth,
        },
        {
          title: "Zoom Out",
          handleClick: () => {
            updateFilters({ isShowMonth: false });
          },
          className: "px-3",
          icon: () => <ZoomOut className="w-4 max-md:w-3 h-4 max-md:h-3 bg" />,
          variant: "outline",
          hide: !resourceAllocationPermission.write,
          disabled: !filters.isShowMonth,
        },
      ]}
      showFilterValue
    />
  );
};

export { ResourceTimLineHeaderSection };
