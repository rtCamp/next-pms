/**
 * Internal dependencies.
 */
import { OverviewSection } from "../components/overview-section";

export function Summary({ text }: { text: string }) {
  return (
    <OverviewSection title="Summary">
      <p className="text-sm leading-relaxed text-ink-gray-7">{text}</p>
    </OverviewSection>
  );
}
