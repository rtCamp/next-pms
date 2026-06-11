/**
 * Internal dependencies.
 */
import type { Todo } from "../types";

export interface CreateTodoModalProps {
  open: boolean;
  onClose: () => void;
  todo?: Todo | null;
}
