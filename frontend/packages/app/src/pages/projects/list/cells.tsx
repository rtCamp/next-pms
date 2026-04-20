/**
 * External dependencies.
 */
import { Avatar, Progress, Tooltip } from "@rtcamp/frappe-ui-react";
import { Calendar } from "lucide-react";

/**
 * Internal dependencies.
 */
import {
  PHASE_DOT_CLASS,
  PHASE_LABELS,
  RISK_DOT_CLASS,
} from "./constants";
import { formatProjectDate } from "./format";
import type { EmployeeRef, Phase, RiskLevel } from "./types";

export function DateCell({ isoDate }: { isoDate: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-gray-7">
      <Calendar className="size-3.5 text-ink-gray-4" />
      {formatProjectDate(isoDate)}
    </span>
  );
}

function Dot({ colorClass }: { colorClass: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${colorClass}`}
    />
  );
}

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
        <Dot colorClass={RISK_DOT_CLASS[riskLevel]} />
        <span className="truncate font-medium text-ink-gray-8">{name}</span>
      </div>
    </Tooltip>
  );
}

export function PhaseCell({ phase }: { phase: Phase }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-ink-gray-7">
      <Dot colorClass={PHASE_DOT_CLASS[phase]} />
      <span className="truncate">{PHASE_LABELS[phase]}</span>
    </div>
  );
}

const BUDGET_TIER_CLASSES: Record<"healthy" | "moderate" | "over", string> = {
  healthy: "!bg-surface-green-2 [&>div]:!bg-surface-green-5",
  moderate: "!bg-surface-amber-2 [&>div]:!bg-surface-amber-5",
  over: "!bg-surface-red-3 [&>div]:!bg-surface-red-5",
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
