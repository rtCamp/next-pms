/**
 * Internal dependencies.
 */
import { AboutSection } from "./aboutSection";
import type { ProjectProgressHours } from "./types";

export function ProgressHoursSection({
  progress,
}: {
  progress: ProjectProgressHours;
}) {
  const { consumed, total } = progress;
  const hasValidTotal = total > 0;
  const pct = hasValidTotal
    ? Math.min(100, Math.max(0, (consumed / total) * 100))
    : 0;
  const ariaValueMax = Math.max(0, total);
  const ariaValueNow = Math.min(ariaValueMax, Math.max(0, consumed));

  return (
    <AboutSection value="progress" title="Progress (hours)">
      <div className="flex flex-col gap-2.5 px-5 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-ink-gray-7">
            {consumed} hours
          </span>
          <span className="text-base font-light text-ink-gray-5">
            {total} hours
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={ariaValueMax}
          aria-valuenow={ariaValueNow}
          className="relative h-2 w-full overflow-hidden rounded-full bg-surface-gray-2"
        >
          <span
            aria-hidden
            className="absolute left-0 top-0 h-full bg-surface-blue-4"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </AboutSection>
  );
}
