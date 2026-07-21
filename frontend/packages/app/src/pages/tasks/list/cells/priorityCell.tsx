/**
 * External dependencies.
 */
import { SolidDotLg } from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import { pickAllowed } from "@/lib/utils";
import { TextCell } from "./textCell";
import { TASK_PRIORITIES } from "../../constants";
import type { TaskPriority } from "../../types";

const priorityDotVariants = cva("size-4 shrink-0", {
  variants: {
    priority: {
      Low: "text-ink-gray-4",
      Medium: "text-ink-blue-3",
      High: "text-ink-amber-3",
      Urgent: "text-ink-red-3",
    } satisfies Record<TaskPriority, string>,
  },
});

export type PriorityDotProps = VariantProps<typeof priorityDotVariants>;

export function PriorityCell({ priority }: { priority?: string }) {
  const value = pickAllowed<TaskPriority>(priority, TASK_PRIORITIES);

  if (!value) {
    return <TextCell text="N/A" />;
  }
  return (
    <div className="flex min-w-0 items-center gap-2 text-ink-gray-6 text-base">
      <SolidDotLg className={priorityDotVariants({ priority: value })} />
      <span className="truncate">{value}</span>
    </div>
  );
}
