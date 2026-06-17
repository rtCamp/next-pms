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

export const teamBaseAllocationFilters: FilterField[] = [
  {
    name: "date",
    label: "Date",
    type: "daterange",
  },
];

export const teamBusinessUnitFilter: FilterField = {
  name: "business_unit",
  label: "Business Unit",
  type: "string",
};

export const teamPrivilegedAllocationFilters: FilterField[] = [
  ...teamBaseAllocationFilters,
  {
    name: "reports_to",
    label: "Reports To",
    type: "string",
  },
  {
    name: "employee_id",
    label: "Member ID",
    type: "string",
  },
  {
    name: "skills",
    label: "Skills",
    type: "string",
  },
];
