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
import { AboutSection } from "./aboutSection";

const ragVariants = cva("size-4 shrink-0", {
  variants: {
    risk: {
      "at-risk": "text-ink-red-3",
      caution: "text-ink-amber-3",
      "on-track": "text-ink-green-3",
    },
  },
});

function DetailsRow({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-5 py-px">
      <span className="w-[104px] shrink-0 truncate text-base font-light text-ink-gray-5">
        {label}
      </span>
      <div className="flex h-7 flex-1 min-w-0 items-center gap-2 px-2 py-1.5">
        <span className="flex-1 truncate text-base font-light text-ink-gray-7">
          {value}
        </span>
        {suffix}
      </div>
    </div>
  );
}

export function ProjectDetailsSection({ project }: { project: Project }) {
  return (
    <AboutSection value="details" title="Project details">
      <div className="flex flex-col gap-1 pb-2">
        <DetailsRow
          label="Project name"
          value={project.name}
          suffix={
            <SolidDotLg
              aria-label={`Risk: ${project.riskLevel satisfies RiskLevel}`}
              className={ragVariants({ risk: project.riskLevel })}
            />
          }
        />
        <DetailsRow label="Customer" value={project.clientName} />
        <DetailsRow label="Project status" value="Active" />
        <DetailsRow label="Current phase" value={PHASE_LABELS[project.phase]} />
      </div>
    </AboutSection>
  );
}
