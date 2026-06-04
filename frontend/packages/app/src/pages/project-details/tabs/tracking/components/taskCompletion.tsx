import type { TaskCompletion } from "../types";

const ARC_RADIUS = 75;
const ARC_LENGTH = Math.PI * ARC_RADIUS;

export function TaskCompletionCell({ data }: { data: TaskCompletion }) {
  const ratio =
    data.totalIssuesCreated > 0
      ? Math.min(1, data.issuesClosed / data.totalIssuesCreated)
      : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <span className="text-base text-ink-gray-8 font-medium">
        Task completion
      </span>
      <div className="flex items-center gap-6">
        <div className="relative shrink-0 w-[167px]">
          <svg
            viewBox="0 0 200 110"
            className="block w-full h-auto"
            aria-hidden
          >
            <path
              d="M 15 100 A 75 75 0 0 1 185 100"
              fill="none"
              stroke="currentColor"
              strokeWidth={22}
              strokeLinecap="round"
              className="text-surface-gray-2"
            />
            <path
              d="M 15 100 A 75 75 0 0 1 185 100"
              fill="none"
              stroke="currentColor"
              strokeWidth={22}
              strokeLinecap="round"
              strokeDasharray={`${ratio * ARC_LENGTH} ${ARC_LENGTH}`}
              className="text-surface-green-5"
            />
          </svg>
          <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
            <span className="text-base font-semibold text-ink-gray-8">
              {percent}%
            </span>
            <span className="text-xs text-ink-gray-6">completed</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate">
              Total issues created
            </span>
            <span>{data.totalIssuesCreated}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate">Open issues</span>
            <span>{data.issuesOpen}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate">Completed issues</span>
            <span>{data.issuesClosed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
