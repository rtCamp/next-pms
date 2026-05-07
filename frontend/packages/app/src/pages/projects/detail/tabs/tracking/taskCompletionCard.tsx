/**
 * Internal dependencies.
 */
import type { TaskCompletionData } from "./types";

const VIEWBOX = 100;
const STROKE = 14;
const RADIUS = (VIEWBOX - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_SPAN = 0.75;
const ARC_LENGTH = CIRCUMFERENCE * ARC_SPAN;

export function TaskCompletionCard({ data }: { data: TaskCompletionData }) {
  const { totalIssues, openIssues, completedIssues } = data;
  const percent =
    totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
  const safe = Math.min(100, Math.max(0, percent));
  const fillLength = ARC_LENGTH * (safe / 100);

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <h3 className="truncate text-base font-medium text-ink-gray-8">
        Task completion
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative size-[140px] shrink-0">
          <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
            <g transform="rotate(135 50 50)">
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE}
                strokeLinecap="round"
                className="stroke-surface-gray-3"
                strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
              />
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE}
                strokeLinecap="round"
                className="stroke-surface-green-5"
                strokeDasharray={`${fillLength} ${CIRCUMFERENCE}`}
              />
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-semibold text-ink-gray-8">
              {percent}%
            </span>
            <span className="text-xs font-normal text-ink-gray-6">
              completed
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-base font-normal text-ink-gray-6">
              Total issues created
            </span>
            <span className="shrink-0 text-base font-medium text-ink-gray-6">
              {totalIssues}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-base font-normal text-ink-gray-6">
              Open issues
            </span>
            <span className="shrink-0 text-base font-medium text-ink-gray-6">
              {openIssues}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-base font-normal text-ink-gray-6">
              Completed issues
            </span>
            <span className="shrink-0 text-base font-medium text-ink-gray-6">
              {completedIssues}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
