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
    name: "business_unit",
    label: "Business Unit",
    type: "string",
  },
  {
    name: "reporting_manager",
    label: "Reporting Manager",
    type: "string",
  },
];
