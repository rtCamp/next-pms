/**
 * Internal dependencies.
 */
import { pickAllowed } from "@/lib/utils";
import { TextCell } from "./textCell";
import { TASK_PRIORITIES } from "../../constants";
import type { TaskPriority } from "../../types";

export function PriorityCell({ priority }: { priority?: string }) {
  const value = pickAllowed<TaskPriority>(priority, TASK_PRIORITIES);

  if (!value) {
    return <TextCell text="N/A" />;
  }
  return <TextCell text={value} />;
}
