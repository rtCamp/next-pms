/**
 * Internal dependencies.
 */
import StarRating from "../starRating";
import type { BreakdownMetric } from "../types";

interface FeedbackBreakdownProps {
  metrics: BreakdownMetric[];
}

export function FeedbackBreakdown({ metrics }: FeedbackBreakdownProps) {
  if (metrics.length === 0)
    return (
      <p className="text-base text-ink-gray-5">
        No feedback available for this month.
      </p>
    );
  return (
    <div className="flex flex-col gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex overflow-hidden flex-col gap-2 justify-between p-3 rounded-lg border bg-surface-white border-outline-gray-1"
        >
          <span className="text-base text-ink-gray-5">{metric.label}</span>
          <div className="flex justify-between items-center">
            <StarRating
              rating={metric.rating}
              totalStars={4}
              activeColor="var(--color-amber-600)"
              inactiveColor="var(--color-gray-300)"
            />
            <span className="text-base text-ink-gray-8">
              {metric.percentage}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
