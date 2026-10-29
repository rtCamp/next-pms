/**
 * Internal dependencies.
 */
import {
  MANAGED_PROJECTS_HELP,
  MANAGED_PROJECTS_HOURS_TOOLTIP,
} from "@/pages/dashboard/help";

export const ASSIGNED_PROJECTS_COLUMNS = [
  { key: "name", label: "Projects", width: 3, align: "left" },
  {
    key: "remaining",
    label: "Remaining",
    width: "96px",
    align: "right",
    help: MANAGED_PROJECTS_HELP.remaining,
  },
  {
    key: "hoursBurn",
    label: "Hours Burn",
    width: "140px",
    align: "center",
    help: MANAGED_PROJECTS_HELP.hoursBurn,
  },
  {
    key: "billableLastWeek",
    label: "Billable (last week)",
    width: "160px",
    align: "right",
    tooltip: MANAGED_PROJECTS_HOURS_TOOLTIP,
  },
  {
    key: "nonBillableLastWeek",
    label: "Non-billable (last week)",
    width: "176px",
    align: "right",
    tooltip: MANAGED_PROJECTS_HOURS_TOOLTIP,
  },
];
