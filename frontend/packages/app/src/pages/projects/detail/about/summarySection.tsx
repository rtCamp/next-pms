/**
 * Internal dependencies.
 */
import { AboutSection } from "./aboutSection";

export function SummarySection({ summary }: { summary: string }) {
  return (
    <AboutSection value="summary" title="Summary">
      <p className="px-5 pb-4 text-base font-normal leading-relaxed text-ink-gray-7">
        {summary}
      </p>
    </AboutSection>
  );
}
