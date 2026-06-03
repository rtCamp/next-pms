import { CircularProgressBar } from "@rtcamp/frappe-ui-react";
import type { TaskCompletion } from "../types";

export function TaskCompletionCell({ data }: { data: TaskCompletion }) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-outline-gray-1 bg-surface-cards p-3">
      <span className="text-base text-ink-gray-8 font-medium">
        Task completion
      </span>
      <div className="flex items-center gap-6">
        <div className="shrink-0">
          <CircularProgressBar
            step={data.issuesClosed}
            totalSteps={data.totalIssuesCreated}
            showPercentage
            theme="green"
            size="lg"
          />
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
