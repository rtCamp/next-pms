/**
 * External dependencies.
 */
import { SolidDotLg } from "@rtcamp/frappe-ui-react/icons";
import { cva } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import { PHASE_LABELS } from "@/pages/projects/list/constants";
import type { Project, RiskLevel } from "@/pages/projects/list/types";
import { Section } from "./section";

const ragVariants = cva("size-4 shrink-0", {
  variants: {
    risk: {
      "at-risk": "text-ink-red-3",
      caution: "text-ink-amber-3",
      "on-track": "text-ink-green-3",
    },
  },
});

const labelClass = "truncate text-base font-light text-ink-gray-5";
const valueClass = "truncate text-base font-light text-ink-gray-7";

export function ProjectDetailsSection({ project }: { project: Project }) {
  return (
    <Section value="details" title="Project details">
      <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 px-5 pb-2">
        <span className={labelClass}>Project name</span>
        <div className="flex min-w-0 items-center gap-2">
          <span className={`flex-1 ${valueClass}`}>{project.name}</span>
          <SolidDotLg
            aria-label={`Risk: ${project.riskLevel satisfies RiskLevel}`}
            className={ragVariants({ risk: project.riskLevel })}
          />
        </div>

        <span className={labelClass}>Customer</span>
        <span className={valueClass}>{project.clientName}</span>

        <span className={labelClass}>Project status</span>
        <span className={valueClass}>Active</span>

        <span className={labelClass}>Current phase</span>
        <span className={valueClass}>{PHASE_LABELS[project.phase]}</span>
      </div>
    </Section>
  );
}
