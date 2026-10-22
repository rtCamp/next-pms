import type { FilterField } from "@/components/Filter";
import { EQUALITY_OPERATORS } from "@/pages/allocations/shared/constants";

/** Fields of the Project page's Filter. */
export const PROJECT_FILTER_FIELDS: FilterField[] = [
  {
    name: "tag",
    label: "Tag",
    type: "link",
    link: { doctype: "Tag" },
    operators: EQUALITY_OPERATORS,
  },
  {
    name: "customer",
    label: "Customer",
    type: "link",
    link: { doctype: "Customer", labelField: "customer_name" },
    operators: EQUALITY_OPERATORS,
  },
  {
    name: "billing_type",
    label: "Billing Type",
    type: "select",
    operators: EQUALITY_OPERATORS,
    options: [
      { label: "Non-Billable", value: "Non-Billable" },
      { label: "Fixed Cost", value: "Fixed Cost" },
      { label: "Retainer", value: "Retainer" },
      { label: "Time and Material", value: "Time and Material" },
    ],
  },
  {
    name: "project_type",
    label: "Project Type",
    type: "link",
    link: { doctype: "Project Type" },
    operators: EQUALITY_OPERATORS,
  },
  {
    name: "project_manager",
    label: "Project Manager",
    type: "link",
    link: {
      doctype: "Employee",
      labelField: "employee_name",
      valueField: "user_id",
      customMethod: {
        method: "next_pms.timesheet.api.employee.get_employee_list",
        args: { roles: ["Projects Manager"] },
      },
    },
    operators: EQUALITY_OPERATORS,
  },
];

export const PROJECT_ENDPOINT =
  "/api/v2/method/next_pms.resource_management.api.project.get_resource_management_project_view_data";
