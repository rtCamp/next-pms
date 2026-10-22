export interface CreateGrowthModalProps {
  open: boolean;
  onClose: () => void;
  growthName?: string | null;
  defaultProject?: string | null;
  defaultCustomer?: string | null;
  fallbackCurrency?: string | null;
}
