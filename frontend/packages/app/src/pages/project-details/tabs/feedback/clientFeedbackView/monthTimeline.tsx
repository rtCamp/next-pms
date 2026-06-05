/**
 * External dependencies.
 */
import { mergeClassNames as cn } from "@next-pms/design-system";

/**
 * Internal dependencies.
 */
import { MOCK_MONTHS } from "../mock-data";
import type { MonthEntry } from "../types";

interface MonthTimelineProps {
  selectedMonth: string;
  onSelectMonth: (key: string) => void;
}

function getScoreColorClass(
  score: MonthEntry["score"],
  isSelected: boolean,
): string {
  if (isSelected) return "text-white";
  if (score === null) return "text-ink-gray-4";
  if (score >= 80) return "text-ink-gray-6";
  if (score >= 60) return "text-ink-amber-4";
  return "text-ink-red-4";
}

export function MonthTimeline({
  selectedMonth,
  onSelectMonth,
}: MonthTimelineProps) {
  return (
    <div className="relative">
      {/* Edge blur */}
      <div className="absolute top-0 left-0 z-10 w-12 h-full from-white to-transparent pointer-events-none bg-linear-to-r" />

      <div className="overflow-x-auto pb-4 mb-4 no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {MOCK_MONTHS.map((entry) => {
            const isSelected = entry.key === selectedMonth;
            const scoreClass = getScoreColorClass(entry.score, isSelected);
            return (
              <button
                key={entry.key}
                type="button"
                onClick={() => onSelectMonth(entry.key)}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl shrink-0 w-[42px] py-2 gap-0.5 cursor-pointer transition-colors",
                  isSelected ? "bg-surface-gray-7" : "bg-surface-gray-1",
                )}
              >
                <span
                  className={cn(
                    "text-2xs",
                    isSelected ? "text-ink-gray-3" : "text-ink-gray-4",
                  )}
                >
                  {entry.month}
                </span>
                <span className={cn("text-base", scoreClass)}>
                  {entry.score !== null ? entry.score : "–"}
                </span>
                {entry.month === "Jan" && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-surface-white rounded px-1 h-3 flex items-center justify-center">
                    <span className="text-[9px] text-ink-gray-5 whitespace-nowrap leading-none">
                      {entry.year}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Edge blur */}
      <div className="absolute top-0 right-0 z-10 w-12 h-full from-white to-transparent pointer-events-none bg-linear-to-l" />
    </div>
  );
}
