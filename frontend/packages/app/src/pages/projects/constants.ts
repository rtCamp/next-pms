/**
 * External dependencies.
 */
import { Kanban, AlignLeft } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { Phase } from "./types";

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

export const PROJECT_LIST_PAGE_SIZE = 20;

export const PHASE_LABELS: Record<Phase, string> = {
  "delivery-prep": "Delivery Prep",
  "kick-off": "Kick-off",
  discovery: "Discovery",
  development: "Development",
  launch: "Launch",
  "close-out": "Close-out",
};
