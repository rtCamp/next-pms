/**
 * External dependencies.
 */
import { CalendarClock, Contact } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { OverviewCommunication } from "../types";
import { OverviewField } from "../components/overview-field";
import { OverviewSection } from "../components/overview-section";

export function Communication({ data }: { data: OverviewCommunication }) {
  return (
    <OverviewSection title="Communication">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <OverviewField
          icon={<Contact className="size-[18px]" />}
          label="Point of contact"
          value={data.pointOfContact}
        />
        <OverviewField
          icon={<CalendarClock className="size-[18px]" />}
          label="Time report frequency"
          value={data.timeReportFrequency}
        />
      </div>
    </OverviewSection>
  );
}
