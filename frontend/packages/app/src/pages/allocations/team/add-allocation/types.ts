export interface AddAllocationInitialValues {
  allocationName?: string;
  employeeId?: string;
  projectId?: string;
  customerName?: string;
  recurrence?: "one-time" | "recurring";
  includeWeekends?: boolean;
  fromDate?: string;
  toDate?: string;
  hoursPerDay?: number;
  repeatFor?: number;
  isBillable?: boolean;
  isTentative?: boolean;
  note?: string;
}

export interface AddAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "add" | "edit";
  onEditScheduleClick?: () => void;
  initialValues?: AddAllocationInitialValues;
  onSuccess?: () => void;
}

export type ComboboxOption = {
  value: string;
  label: string;
  customer?: string;
};
