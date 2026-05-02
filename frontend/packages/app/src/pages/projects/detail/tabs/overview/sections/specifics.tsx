/**
 * External dependencies.
 */
import { ChartNoAxesColumn, GitBranch, UserCheck } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { OverviewSpecifics } from "../types";
import { OverviewField } from "../components/overview-field";
import { OverviewSection } from "../components/overview-section";

export function Specifics({ data }: { data: OverviewSpecifics }) {
  return (
    <OverviewSection title="Specifics">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <OverviewField
          icon={<ChartNoAxesColumn className="size-[18px]" />}
          label="Priority"
          value={data.priority}
        />
        <OverviewField
          icon={<GitBranch className="size-[18px]" />}
          label="Complexity"
          value={data.complexity}
        />
        <OverviewField
          icon={<UserCheck className="size-[18px]" />}
          label="Key account"
          value={data.keyAccount}
        />
      </div>
    </OverviewSection>
  );
}
