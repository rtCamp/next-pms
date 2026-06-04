import type { RiskStatus } from "../constants";

export interface CreateRiskModalProps {
  open: boolean;
  onClose: () => void;
  riskName?: string | null;
  initialStatus?: RiskStatus | "";
}
