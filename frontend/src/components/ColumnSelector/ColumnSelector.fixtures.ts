import type { SelectorColumn } from "./types";

export const TICKET_COLUMNS: SelectorColumn[] = [
  { label: "ID", value: "name" },
  { label: "Subject", value: "subject" },
  { label: "Status", value: "status" },
  { label: "Priority", value: "priority" },
  { label: "Customer", value: "customer" },
];

export const TICKET_FIELDS: SelectorColumn[] = [
  ...TICKET_COLUMNS,
  { label: "Description", value: "description" },
  { label: "Team", value: "agent_group" },
  { label: "Type", value: "ticket_type" },
  { label: "Total Hold Time", value: "total_hold_time" },
];

export const PINNED_FIRST_TWO: SelectorColumn[] = [
  { label: "ID", value: "name", pinned: true },
  { label: "Subject", value: "subject", pinned: true },
  { label: "Status", value: "status", pinned: false },
  { label: "Priority", value: "priority", pinned: false },
  { label: "Customer", value: "customer", pinned: false },
];
