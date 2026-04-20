/**
 * External dependencies.
 */
import { Avatar, Progress, Tooltip } from "@rtcamp/frappe-ui-react";
import { Calendar } from "lucide-react";

/**
 * Internal dependencies.
 */
import { formatProjectDate } from "./format";
import type { EmployeeRef, Phase, RiskLevel } from "./types";

// Hex values from Figma node 3518:444604 via mcp__figma__get_variable_defs.
// Kept as inline styles rather than Tailwind classes because not every token
// is exposed in the design-system's tailwind config, and we need to pass the
// hex through for the small inline dots.
const RISK_COLORS: Record<RiskLevel, string> = {
  "at-risk": "#e03636",
  caution: "#e79913",
  "on-track": "#46b37e",
};

const PHASE_COLORS: Record<Phase, string> = {
  "delivery-prep": "#3bbde5",
  "kick-off": "#0289f7",
  discovery: "#e79913",
  // TODO(#1194): issue body says Development = amber, Figma shows green.
  // Ayush (email, 2026-04-20) approved using Figma values; keep in sync
  // if the design changes.
  development: "#46b37e",
  launch: "#46b37e",
  "close-out": "#7757ee",
};

const PHASE_LABELS: Record<Phase, string> = {
  "delivery-prep": "Delivery Prep",
  "kick-off": "Kick-off",
  discovery: "Discovery",
  development: "Development",
  launch: "Launch",
  "close-out": "Close-out",
};

export function DateCell({ isoDate }: { isoDate: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-gray-7">
      <Calendar className="size-3.5 text-ink-gray-4" />
      {formatProjectDate(isoDate)}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

// The outer wrapper is `flex` (block-level), not `inline-flex`, so it
// respects the grid column width — otherwise inline-flex sizes to content
// and the inner `truncate` span never overflows, which in turn means the
// Base UI Tooltip.Trigger's hover target sits over non-truncated text.
export function ProjectNameCell({
  name,
  riskLevel,
}: {
  name: string;
  riskLevel: RiskLevel;
}) {
  return (
    <Tooltip text={name}>
      <div className="flex min-w-0 items-center gap-2">
        <Dot color={RISK_COLORS[riskLevel]} />
        <span className="truncate font-medium text-ink-gray-8">{name}</span>
      </div>
    </Tooltip>
  );
}

export function PhaseCell({ phase }: { phase: Phase }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-ink-gray-7">
      <Dot color={PHASE_COLORS[phase]} />
      <span className="truncate">{PHASE_LABELS[phase]}</span>
    </div>
  );
}

// Cost-burn tier colors per Figma get_variable_defs on 3518:444604. The
// design-system's Tailwind `surface-green-*` / `surface-amber-*` tokens
// don't line up with Figma's `-3` (light) / `-5` (saturated) scale — only
// `surface-red-3` / `-5` match — so the green and amber pairs are passed
// as arbitrary hex to stay faithful to the design. `!` overrides Progress's
// default `bg-surface-gray-2` container + inner `bg-surface-gray-7` fill.
const BUDGET_TIER_CLASSES: Record<"healthy" | "moderate" | "over", string> = {
  healthy: "!bg-[#c3f9d3] [&>div]:!bg-[#278f5e]",
  moderate: "!bg-[#feeda9] [&>div]:!bg-[#db7706]",
  over: "!bg-[#ffd8d8] [&>div]:!bg-[#cc2929]",
};

function budgetTier(percent: number): "healthy" | "moderate" | "over" {
  if (percent > 100) return "over";
  if (percent >= 70) return "moderate";
  return "healthy";
}

export function BudgetProgressCell({ percent }: { percent: number }) {
  const tier = budgetTier(percent);
  return (
    <div className="w-full">
      <Progress
        value={Math.min(percent, 100)}
        size="md"
        className={BUDGET_TIER_CLASSES[tier]}
      />
    </div>
  );
}

// Note on Avatar: frappe-ui-react's Avatar renders only `label[0]` when no
// image is provided and uses a hardcoded `bg-surface-gray-2` background.
// Figma shows two-letter initials on themed backgrounds (avatar/* tokens).
// Matching that would need a design-system change (new prop or a new
// `ColoredInitialsAvatar`) — flagged in the PR body for follow-up. Until
// then, use the stock Avatar at size="md" (24px) so it's at least readable.
export function EmployeeCell({ employee }: { employee: EmployeeRef }) {
  return (
    <Tooltip text={employee.name}>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar
          size="md"
          shape="circle"
          image={employee.avatar}
          label={employee.initials}
        />
        <span className="truncate text-ink-gray-7">{employee.name}</span>
      </div>
    </Tooltip>
  );
}
