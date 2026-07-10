/**
 * External dependencies.
 */
import type { FilterField, MultiSelectOption } from "@rtcamp/frappe-ui-react";

export const teamAllocationsTypeOptions: MultiSelectOption[] = [
  { label: "Confirmed only", value: "Confirmed" },
  { label: "Tentative only", value: "Tentative" },
  { label: "Billable only", value: "billable" },
  { label: "Non-billable only", value: "non-billable" },
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
    type: "string",
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
    },
    operators: [
      { label: "Equals", value: "=" },
      { label: "Not Equals", value: "!=" },
    ],
  },
];
