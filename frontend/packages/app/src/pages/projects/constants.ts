/**
 * External dependencies.
 */
import { Kanban, AlignLeft } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { kebabToTitleCase } from "@/lib/utils";

export const VIEWS = [
  { key: "list", label: "List view", icon: AlignLeft },
  { key: "kanban", label: "Kanban view", icon: Kanban },
] as const;

export const PHASES = [
  "delivery-prep",
  "kick-off",
  "discovery",
  "development",
  "launch",
  "close-out",
] as const;

export const RAG_STATUS = ["red", "amber", "green"] as const;

export const PROJECT_TYPES = ["fixed-cost", "retainer", "external"] as const;

export const PROJECT_LIST_PAGE_SIZE = 4;

export const RAG_OPTIONS = [
  { label: "Red", value: "red" },
  { label: "Amber", value: "amber" },
  { label: "Green", value: "green" },
  { label: "All", value: "" },
];

export const STATUS_OPTIONS = [
  { label: "Open", value: "Open" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "All", value: "" },
];

export const PHASE_OPTIONS = [
  ...PHASES.map((phase) => ({
    label: kebabToTitleCase(phase),
    value: kebabToTitleCase(phase),
  })),
  { label: "All", value: "" },
];
