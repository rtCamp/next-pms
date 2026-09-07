/**
 * Internal dependencies.
 */
import type { WidgetKey } from "../../types";

export interface AddWidgetModalProps {
  open: boolean;
  hidden: WidgetKey[];
  isSaving: boolean;
  onClose: () => void;
  onSave: (hidden: WidgetKey[]) => void;
}
