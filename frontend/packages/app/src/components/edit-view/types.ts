/**
 * Internal dependencies.
 */
import type { View } from "@/types";

export interface EditViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: View | null;
  editView: (view: {
    label: string;
    icon: string;
    isPublic: boolean;
  }) => Promise<void>;
}
