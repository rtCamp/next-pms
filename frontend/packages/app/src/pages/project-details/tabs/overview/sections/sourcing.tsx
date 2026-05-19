/**
 * External dependencies.
 */
import { MapPin, Search, Tag } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useProjectDetail } from "../../../context";
import { OverviewField } from "../components/overviewField";
import { OverviewSection } from "../components/overviewSection";

const EMPTY = "—";

export function Sourcing() {
  const source = useProjectDetail(
    (state) => state.project?.project_type ?? EMPTY,
  );
  const primaryLocation = useProjectDetail(
    (state) => state.project?.custom_host ?? EMPTY,
  );
  const previousCms = useProjectDetail(
    (state) => state.project?.custom_3rd_parties ?? EMPTY,
  );

  return (
    <OverviewSection title="Sourcing">
      <div className="flex w-[828px] max-w-full flex-wrap gap-4">
        <OverviewField
          icon={<Search className="size-[18px]" />}
          label="Source"
          value={source}
        />
        <OverviewField
          icon={<MapPin className="size-[18px]" />}
          label="Primary location"
          value={primaryLocation}
        />
        <OverviewField
          icon={<Tag className="size-[18px]" />}
          label="Previous CMS"
          value={previousCms}
        />
      </div>
    </OverviewSection>
  );
}
