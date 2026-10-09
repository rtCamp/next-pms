/**
 * Internal dependencies.
 */
import type { LinkedRecord, Todo } from "../types";

export interface CreateTodoModalProps {
  open: boolean;
  onClose: () => void;
  todo?: Todo | null;
  linkedTo?: LinkedRecord | null;
}
