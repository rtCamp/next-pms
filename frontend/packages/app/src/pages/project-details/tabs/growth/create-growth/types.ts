export interface CreateGrowthModalProps {
  open: boolean;
  onClose: () => void;
  growthName?: string | null;
  defaultProject?: string | null;
  defaultCustomer?: string | null;
  defaultStatus?: string | null;
  fallbackCurrency?: string | null;
}
