import type { FilterField } from "@/components/Filter";
import { EQUALITY_OPERATORS } from "@/pages/allocations/shared/constants";
import { ALLOCATION_TYPE_OPTIONS } from "@/pages/allocations/shared/filterParams";

/** Query params of the Team page's designation and department filters (JSON lists). */
export const TEAM_LIST_PARAMS = ["designation", "department"] as const;
export type TeamListParam = (typeof TEAM_LIST_PARAMS)[number];

export const TEAM_ALLOCATION_TYPE_OPTIONS = ALLOCATION_TYPE_OPTIONS;

export const BUSINESS_UNIT_FIELD = "business_unit";

/** Fields of the Team page's Filter; Business Unit only where the site has one. */
export const TEAM_FILTER_FIELDS: FilterField[] = [
  { name: "skills", label: "Skill", type: "string" },
  {
    name: "tag",
    label: "Tag",
    type: "link",
    link: { doctype: "Tag" },
    operators: EQUALITY_OPERATORS,
  },
  {
    name: BUSINESS_UNIT_FIELD,
    label: "Business Unit",
    type: "link",
    link: { doctype: "Business Unit" },
    operators: EQUALITY_OPERATORS,
  },
  {
    name: "reporting_manager",
    label: "Reporting Manager",
    type: "link",
    link: {
      doctype: "Employee",
      labelField: "employee_name",
      valueField: "employee_name",
      customMethod: {
        method: "next_pms.timesheet.api.employee.get_employee_list",
        args: { roles: ["Projects Manager"] },
      },
    },
    operators: EQUALITY_OPERATORS,
  },
];

export const TEAM_ENDPOINT =
  "/api/v2/method/next_pms.resource_management.api.team.get_resource_management_team_view_data";
