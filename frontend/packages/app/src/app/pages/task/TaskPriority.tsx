/**
 * External dependencies
 */
import { Badge } from "@next-pms/design-system/components";
/**
 * Internal dependencies
 */

import { cn } from "@/lib/utils";
import { TaskData } from "@/types";

export const TaskPriority = ({ priority }: { priority: TaskData["priority"] }) => {
  const priorityCss = {
    Low: "bg-slate-200 text-slate-900 hover:bg-slate-200",
    Medium: "bg-warning/20 text-warning hover:bg-warning/20",
    High: "bg-orange-200 text-orange-900 hover:bg-orange-200",
    Urgent: "bg-destructive/20 text-destructive hover:bg-destructive/20",
  };
  return <Badge className={cn(priorityCss[priority])}>{priority}</Badge>;
};
