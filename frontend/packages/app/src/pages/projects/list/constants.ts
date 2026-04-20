/**
 * Internal dependencies.
 */
import type { Phase, RiskLevel } from "./types";

export const RISK_DOT_CLASS: Record<RiskLevel, string> = {
  "at-risk": "bg-ink-red-3",
  caution: "bg-ink-amber-3",
  "on-track": "bg-ink-green-3",
};

// Phase → Tailwind text color class for the donut indicator's currentColor.
// Values come from Ayush's review on PR #1220 (cells.tsx:33, 2026-04-20)
// and override the earlier Figma-derived map. `kick-off` was not listed
// in his note and is kept on `ink-blue-3` pending clarification.
export const PHASE_INDICATOR_CLASS: Record<Phase, string> = {
  "delivery-prep": "text-ink-gray-4",
  "kick-off": "text-ink-blue-3",
  discovery: "text-ink-blue-3",
  development: "text-ink-cyan-3",
  launch: "text-ink-cyan-3",
  "close-out": "text-ink-violet-3",
};

export const PHASE_LABELS: Record<Phase, string> = {
  "delivery-prep": "Delivery Prep",
  "kick-off": "Kick-off",
  discovery: "Discovery",
  development: "Development",
  launch: "Launch",
  "close-out": "Close-out",
};
