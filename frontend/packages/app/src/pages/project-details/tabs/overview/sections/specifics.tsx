/**
 * External dependencies.
 */
import { ChartNoAxesColumn, GitBranch, UserCheck } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "../../../context";
import { OverviewField } from "../components/overviewField";
import { OverviewSection } from "../components/overviewSection";

const EMPTY = "—";

export function Specifics() {
  const priority = useProjectDetail(
    (state) => state.project?.priority ?? EMPTY,
  );
  const complexity = useProjectDetail(
    (state) => state.project?.custom_complexity || EMPTY,
  );
  const keyAccount = useProjectDetail(
    (state) => state.project?.custom_key_account || EMPTY,
  );

  return (
    <OverviewSection title="Specifics">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <OverviewField
          icon={<ChartNoAxesColumn className="size-[18px]" />}
          label="Priority"
          value={priority}
        />
        <OverviewField
          icon={<GitBranch className="size-[18px]" />}
          label="Complexity"
          value={complexity}
        />
        <OverviewField
          icon={<UserCheck className="size-[18px]" />}
          label="Key account"
          value={keyAccount}
        />
      </div>
    </OverviewSection>
  );
}
