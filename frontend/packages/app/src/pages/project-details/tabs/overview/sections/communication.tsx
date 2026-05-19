/**
 * External dependencies.
 */
import { CalendarClock, Contact } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "../../../context";
import { OverviewField } from "../components/overviewField";
import { OverviewSection } from "../components/overviewSection";

const EMPTY = "—";

export function Communication() {
  const pointOfContact = useProjectDetail(
    (state) => state.project?.custom_client_point_of_contact ?? EMPTY,
  );
  const timeReportFrequency = useProjectDetail(
    (state) => state.project?.frequency ?? EMPTY,
  );

  return (
    <OverviewSection title="Communication">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <OverviewField
          icon={<Contact className="size-[18px]" />}
          label="Point of contact"
          value={pointOfContact}
        />
        <OverviewField
          icon={<CalendarClock className="size-[18px]" />}
          label="Time report frequency"
          value={timeReportFrequency}
        />
      </div>
    </OverviewSection>
  );
}
