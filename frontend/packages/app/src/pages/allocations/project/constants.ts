/**
 * External dependencies.
 */
import type { FilterField, MultiSelectOption } from "@rtcamp/frappe-ui-react";

export const projectAllocationsTypeOptions: MultiSelectOption[] = [
  { label: "Billable only", value: "billable" },
  { label: "Non-billable only", value: "non-billable" },
];

export const projectBaseAllocationFilters: FilterField[] = [
  {
    name: "date",
    label: "Date",
    type: "daterange",
  },
];

export const projectAllocationFilters: FilterField[] = [
  ...projectBaseAllocationFilters,
  {
    name: "customer",
    label: "Customer",
    type: "string",
  },
  {
    name: "billing_type",
    label: "Billing Type",
    type: "string",
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
  {
    name: "project_id",
    label: "Project ID",
    type: "string",
  },
  {
    name: "tag",
    label: "Tag",
    type: "string",
  },
];
