/**
 * Internal dependencies.
 */
import { cn } from "@/lib/utils";
import { TaskData } from "@/types";

export const TaskStatus = ({ status }: { status: TaskData["status"] }) => {
  const statusCss = {
    Open: "bg-blue-100 text-blue-500 hover:bg-blue-200",
    Working: "bg-warning/20 text-warning hover:bg-warning/20",
    "Pending Review": "bg-orange-100 text-orange-400 hover:bg-warning/20",
    Overdue: "bg-destructive/20 text-destructive hover:bg-destructive/20",
    Template: "bg-slate-200 text-slate-900 hover:bg-slate-200",
    Completed: "bg-success/20 text-success hover:bg-success/20",
    Cancelled: "bg-destructive/20 text-destructive hover:bg-destructive/20",
  };
  return (
    <div
      title={status}
      className={cn(
        statusCss[status],
        "py-1 px-2 truncate  w-fit max-w-40 text-xs font-bold text-center cursor-pointer rounded-full ",
      )}
    >
      {status}
    </div>
  );
};
