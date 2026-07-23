import type { EnrichedRiskUpdateEntry, RiskDetail } from "../types";

export interface AddUpdateModalProps {
  open: boolean;
  onClose: () => void;
  risk: RiskDetail;
  onSuccess: () => void;
  editEntry?: EnrichedRiskUpdateEntry;
}
