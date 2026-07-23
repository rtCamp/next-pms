/**
 * Internal dependencies.
 */
import { kebabToTitleCase } from "@/lib/utils";

export const PHASES = [
  "delivery-prep",
  "kick-off",
  "discovery",
  "development",
  "launch",
  "close-out",
] as const;

export const RAG_STATUS = ["red", "amber", "green"] as const;

export const PROJECT_LIST_PAGE_SIZE = 20;

export const RAG_OPTIONS = [
  { label: "Red", value: "red" },
  { label: "Amber", value: "amber" },
  { label: "Green", value: "green" },
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
