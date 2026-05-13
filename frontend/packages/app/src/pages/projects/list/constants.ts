/**
 * Internal dependencies.
 */
import type { Phase } from "./types";

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

export const PHASE_LABELS: Record<Phase, string> = {
  "delivery-prep": "Delivery Prep",
  "kick-off": "Kick-off",
  discovery: "Discovery",
  development: "Development",
  launch: "Launch",
  "close-out": "Close-out",
};
