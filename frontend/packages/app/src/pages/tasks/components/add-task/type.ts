/**
 * Internal Dependencies
 */
import type { addTaskFormValues } from "./schema";

export type AddTaskPrefill = Partial<addTaskFormValues>;

export interface AddTaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: AddTaskPrefill | null;
  taskName?: string | null;
  onSuccess?: () => void;
}
