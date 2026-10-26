/**
 * External dependencies.
 */
import type { FieldHelp } from "@next-pms/design-system/components";

/**
 * Internal dependencies.
 */
import { CALENDAR_HELP } from "../help";

export type TableColumn = {
  key: string;
  label: string;
  width?: string;
  help?: FieldHelp;
};

export const MILESTONE_COLUMNS: TableColumn[] = [
  { key: "title", label: "Title" },
  { key: "category", label: "Type", width: "w-28" },
  { key: "startDate", label: "Start date", width: "w-28" },
  { key: "plannedEndDate", label: "Planned end", width: "w-28" },
  {
    key: "actualEndDate",
    label: "Actual end",
    width: "w-28",
    help: CALENDAR_HELP.milestoneActualEnd,
  },
  { key: "todos", label: "ToDos", width: "w-20" },
  { key: "owner", label: "Owners", width: "w-28" },
  {
    key: "watchers",
    label: "Watchers",
    width: "w-28",
    help: CALENDAR_HELP.watchers,
  },
  { key: "actions", label: "", width: "w-12" },
];

export const TOUCHPOINT_COLUMNS: TableColumn[] = [
  { key: "title", label: "Title" },
  { key: "category", label: "Type", width: "w-28" },
  { key: "plannedEndDate", label: "Planned date", width: "w-28" },
  {
    key: "actualEndDate",
    label: "Actual date",
    width: "w-28",
    help: CALENDAR_HELP.touchpointActualDate,
  },
  { key: "todos", label: "ToDos", width: "w-20" },
  { key: "owner", label: "Owners", width: "w-28" },
  {
    key: "watchers",
    label: "Watchers",
    width: "w-28",
    help: CALENDAR_HELP.watchers,
  },
  { key: "actions", label: "", width: "w-12" },
];
