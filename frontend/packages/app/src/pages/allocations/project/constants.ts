/**
 * External dependencies.
 */
import type { FilterField, MultiSelectOption } from "@rtcamp/frappe-ui-react";

export const projectAllocationsTypeOptions: MultiSelectOption[] = [
  { label: "Billable only", value: "billable" },
  { label: "Non-billable only", value: "non-billable" },
];

export const projectAllocationFilters: FilterField[] = [
  {
    name: "tag",
    label: "Tag",
    type: "string",
  },
  {
    name: "customer",
    label: "Customer",
    type: "string",
  },
  {
    name: "billing_type",
    label: "Billing Type",
    type: "select",
    operators: [
      { label: "Equals", value: "=" },
      { label: "Not Equals", value: "!=" },
    ],
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
    type: "string",
  },
  {
    name: "project_manager",
    label: "Project Manager",
    type: "string",
  },
];
