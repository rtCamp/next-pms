/**
 * Internal Dependencies
 */
import type { AddTaskFormValues } from "./schema";

export type AddTaskPrefill = Partial<AddTaskFormValues>;

export interface AddTaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: AddTaskPrefill | null;
  taskName?: string | null;
  onSuccess?: () => void;
}
