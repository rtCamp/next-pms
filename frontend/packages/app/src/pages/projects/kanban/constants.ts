/**
 * Internal dependencies.
 */
import type { Phase } from "../types";

export const KANBAN_PHASE_ORDER: readonly Phase[] = [
  "delivery-prep",
  "kick-off",
  "discovery",
  "development",
  "launch",
  "close-out",
] as const;

export const KANBAN_COLUMN_WIDTH = 284;
