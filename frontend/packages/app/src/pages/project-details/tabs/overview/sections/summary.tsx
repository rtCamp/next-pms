/**
 * Internal dependencies.
 */
import { useProjectDetail } from "../../../context";
import { OverviewSection } from "../components/overviewSection";

export function Summary() {
  const text = useProjectDetail(
    (state) => state.project?.custom_executive_summary ?? "",
  );

  return (
    <OverviewSection title="Summary">
      <p className="text-sm leading-relaxed text-ink-gray-7">{text}</p>
    </OverviewSection>
  );
}
