import type { EnrichedGrowthUpdateEntry, GrowthDetail } from "../types";

export interface AddUpdateModalProps {
  open: boolean;
  onClose: () => void;
  growth: GrowthDetail;
  onSuccess: () => void;
  editEntry?: EnrichedGrowthUpdateEntry;
}
