/**
 * External dependencies.
 */
import type { FilterField, MultiSelectOption } from "@rtcamp/frappe-ui-react";

export const teamAllocationStatusOptionValues = ["Confirmed", "Tentative"];

export const teamAllocationsTypeOptions: MultiSelectOption[] = [
  { label: "Confirmed only", value: "Confirmed" },
  { label: "Tentative only", value: "Tentative" },
  { label: "Billable only", value: "billable" },
  { label: "Non-billable only", value: "non-billable" },
  { label: "No allocation only", value: "no-allocation" },
];

export const teamAllocationFilters: FilterField[] = [
  {
    name: "skills",
    label: "Skill",
    type: "string",
  },
  {
    name: "tag",
    label: "Tag",
    type: "link",
    link: { doctype: "Tag" },
    operators: [
      { label: "Equals", value: "=" },
      { label: "Not Equals", value: "!=" },
    ],
  },
  {
    name: "business_unit",
    label: "Business Unit",
    type: "link",
    link: { doctype: "Business Unit" },
    operators: [
      { label: "Equals", value: "=" },
      { label: "Not Equals", value: "!=" },
    ],
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
    operators: [
      { label: "Equals", value: "=" },
      { label: "Not Equals", value: "!=" },
    ],
  },
];
