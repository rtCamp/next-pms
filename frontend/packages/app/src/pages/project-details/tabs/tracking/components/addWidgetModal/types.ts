/**
 * Internal dependencies.
 */
import type { WidgetKey } from "../../types";

export interface AddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hidden: WidgetKey[];
  onAdd: (key: WidgetKey) => void;
  onRemove: (key: WidgetKey) => void;
}
