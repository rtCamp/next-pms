/**
 * External dependencies.
 */
import { cva } from "class-variance-authority";
/**
 * Internal dependencies.
 */
import { mergeClassNames } from "../../utils";

export const Variants = cva("", {
  variants: {
    variant: {
      Open: "bg-blue-100 text-blue-500 hover:bg-blue-200",
      Working: "bg-warning/20 text-warning hover:bg-warning/20",
      "Pending Review": "bg-orange-100 text-orange-400 hover:bg-warning/20",
      Overdue: "bg-destructive/20 text-destructive hover:bg-destructive/20",
      Template: "bg-slate-200 text-slate-900 hover:bg-slate-200",
      Completed: "bg-success/20 text-success hover:bg-success/20",
      Cancelled: "bg-destructive/20 text-destructive hover:bg-destructive/20",
    },
  },
  defaultVariants: {
    variant: "Open",
  },
});
type TaskStatusProps = "Open" | "Working" | "Pending Review" | "Overdue" | "Template" | "Completed" | "Cancelled";
const TaskStatus = ({ status }: { status: string }) => {
  return (
    <div
      title={status}
      className={mergeClassNames(
        Variants({ variant: status as TaskStatusProps }),
        "py-1 px-2 truncate  w-fit max-w-40 text-xs font-bold text-center cursor-pointer rounded-full "
      )}
    >
      {status}
    </div>
  );
};

export default TaskStatus;
