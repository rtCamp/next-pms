/**
 * External dependencies.
 */
import { MapPin, Search, Tag } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { OverviewSourcing } from "../types";
import { OverviewField } from "../components/overview-field";
import { OverviewSection } from "../components/overview-section";

export function Sourcing({ data }: { data: OverviewSourcing }) {
  return (
    <OverviewSection title="Sourcing">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <OverviewField
          icon={<Search className="size-[18px]" />}
          label="Source"
          value={data.source}
        />
        <OverviewField
          icon={<MapPin className="size-[18px]" />}
          label="Primary location"
          value={data.primaryLocation}
        />
        <OverviewField
          icon={<Tag className="size-[18px]" />}
          label="Previous CMS"
          value={data.previousCms}
        />
      </div>
    </OverviewSection>
  );
}
