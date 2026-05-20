/**
 * External dependencies.
 */
import {
  AuthenticatedUserAlt,
  Branch,
  SolidPriorityHigh,
} from "@rtcamp/frappe-ui-react/icons";

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
          icon={<SolidPriorityHigh className="size-[18px]" />}
          label="Priority"
          value={priority}
        />
        <OverviewField
          icon={<Branch className="size-[18px]" />}
          label="Complexity"
          value={complexity}
        />
        <OverviewField
          icon={<AuthenticatedUserAlt className="size-[18px]" />}
          label="Key account"
          value={keyAccount}
        />
      </div>
    </OverviewSection>
  );
}
