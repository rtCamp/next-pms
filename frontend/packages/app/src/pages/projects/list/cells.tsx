/**
 * External dependencies.
 */
import { Avatar, Progress, Tooltip } from "@rtcamp/frappe-ui-react";
import { type VariantProps } from "class-variance-authority";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";
import { formatProjectDate } from "@/lib/utils";

import {
  budgetProgressVariants,
  phaseIconVariants,
  PHASE_LABELS,
  riskDotVariants,
} from "./constants";
import type { EmployeeRef, Phase, RiskLevel } from "./types";

export function DateCell({ isoDate }: { isoDate: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-gray-7">
      <Calendar className="size-3.5 text-ink-gray-4" />
      {formatProjectDate(isoDate)}
    </span>
  );
}

type DotProps = VariantProps<typeof riskDotVariants>;

function Dot({ risk }: DotProps) {
  return (
    <span aria-hidden="true" className={riskDotVariants({ risk })} />
  );
}

type StagesIconProps = VariantProps<typeof phaseIconVariants>;

function StagesIcon({ phase }: StagesIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={phaseIconVariants({ phase })}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
      />
    </svg>
  );
}

export function ProjectNameCell({
  id,
  name,
  riskLevel,
}: {
  id: string;
  name: string;
  riskLevel: RiskLevel;
}) {
  const navigate = useNavigate();
  const href = `${ROUTES.base}${ROUTES.project}/${id}`;
  return (
    <Tooltip text={name}>
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          navigate(`${ROUTES.project}/${id}`);
        }}
        className="flex min-w-0 items-center gap-2"
      >
        <Dot risk={riskLevel} />
        <span className="truncate font-medium text-ink-gray-8">{name}</span>
      </a>
    </Tooltip>
  );
}

export function PhaseCell({ phase }: { phase: Phase }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-ink-gray-7">
      <StagesIcon phase={phase} />
      <span className="truncate">{PHASE_LABELS[phase]}</span>
    </div>
  );
}

type BudgetTier = NonNullable<
  VariantProps<typeof budgetProgressVariants>["tier"]
>;

function budgetTier(percent: number): BudgetTier {
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
        className={budgetProgressVariants({ tier })}
      />
    </div>
  );
}

export function EmployeeCell({ employee }: { employee: EmployeeRef }) {
  return (
    <Tooltip text={employee.name}>
      <a
        href={`/desk/user/${encodeURIComponent(employee.email)}`}
        className="flex min-w-0 items-center gap-2"
      >
        <Avatar
          size="md"
          shape="circle"
          image={employee.avatar}
          label={employee.initials}
        />
        <span className="truncate text-ink-gray-7">{employee.name}</span>
      </a>
    </Tooltip>
  );
}
