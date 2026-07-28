/**
 * Internal dependencies.
 */
import { useTracking } from "../context";

// Full circle normalized to 200 units; the rotated dash keeps only the
// top semicircle (100 units) visible, so gauge values map 1:1 to percent.
const CIRCLE_PATH_LENGTH = 200;
const SEMICIRCLE = CIRCLE_PATH_LENGTH / 2;

export function TaskCompletionCell() {
  const tasks = useTracking((state) => state.tracking.tasks);
  const totalIssuesCreated = tasks.total;
  const issuesOpen = tasks.open;
  const issuesClosed = tasks.completed;

  const ratio =
    totalIssuesCreated > 0 ? Math.min(1, issuesClosed / totalIssuesCreated) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <span className="text-base font-medium text-ink-gray-8">
        Task completion
      </span>
      <div className="flex items-center gap-6">
        <div className="relative shrink-0 w-[167px]">
          <svg
            viewBox="0 0 200 110"
            className="block w-full h-auto"
            aria-hidden
          >
            <circle
              cx={100}
              cy={100}
              r={85}
              fill="none"
              stroke="currentColor"
              strokeWidth={22}
              strokeLinecap="round"
              pathLength={CIRCLE_PATH_LENGTH}
              strokeDasharray={`${SEMICIRCLE} ${CIRCLE_PATH_LENGTH}`}
              transform="rotate(180 100 100)"
              className="text-surface-gray-2"
            />
            {ratio > 0 && (
              <circle
                cx={100}
                cy={100}
                r={85}
                fill="none"
                stroke="currentColor"
                strokeWidth={22}
                strokeLinecap="round"
                pathLength={CIRCLE_PATH_LENGTH}
                strokeDasharray={`${ratio * SEMICIRCLE} ${CIRCLE_PATH_LENGTH}`}
                transform="rotate(180 100 100)"
                className="text-surface-green-5"
              />
            )}
          </svg>
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
            <span className="text-lg font-semibold text-ink-gray-8">
              {percent}%
            </span>
            <span className="text-xs text-ink-gray-6">completed</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 text-base text-ink-gray-6">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate">Total issues created</span>
            <span className="font-medium">{totalIssuesCreated}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate">Open issues</span>
            <span className="font-medium">{issuesOpen}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate">Completed issues</span>
            <span className="font-medium">{issuesClosed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
