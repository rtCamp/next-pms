/**
 * External dependencies.
 */
import { TaskStatus, taskStatusMap } from "@next-pms/design-system/components";

export function StatusCell({ status }: { status: string }) {
  const statusKey = taskStatusMap[status] ?? "open";
  return (
    <div className="flex min-w-0 items-center gap-2 text-ink-gray-6 text-base">
      <TaskStatus status={statusKey} />
      <span className="truncate">{status}</span>
    </div>
  );
}
