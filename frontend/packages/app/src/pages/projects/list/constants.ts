/**
 * External dependencies.
 */
import { cva } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import type { Phase } from "./types";

export const PHASE_LABELS: Record<Phase, string> = {
  "delivery-prep": "Delivery Prep",
  "kick-off": "Kick-off",
  discovery: "Discovery",
  development: "Development",
  launch: "Launch",
  "close-out": "Close-out",
};

export const riskDotVariants = cva("size-2 shrink-0", {
  variants: {
    risk: {
      "at-risk": "text-ink-red-3",
      caution: "text-ink-amber-3",
      "on-track": "text-ink-green-3",
    },
  },
});

export const phaseIconVariants = cva("size-4 shrink-0", {
  variants: {
    phase: {
      "delivery-prep": "text-ink-gray-4",
      "kick-off": "text-ink-blue-3",
      discovery: "text-ink-blue-3",
      development: "text-ink-cyan-3",
      launch: "text-ink-cyan-3",
      "close-out": "text-ink-violet-3",
    },
  },
});

export const budgetProgressVariants = cva("", {
  variants: {
    tier: {
      healthy: "!bg-surface-green-2 [&>div]:!bg-surface-green-5",
      moderate: "!bg-surface-amber-2 [&>div]:!bg-surface-amber-5",
      over: "!bg-surface-red-3 [&>div]:!bg-surface-red-5",
    },
  },
});
