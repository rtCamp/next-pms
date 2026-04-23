export interface AddAllocationInitialValues {
  allocationName?: string;
  employeeId?: string;
  projectId?: string;
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
}

export type ComboboxOption = {
  value: string;
  label: string;
  customer?: string;
};
