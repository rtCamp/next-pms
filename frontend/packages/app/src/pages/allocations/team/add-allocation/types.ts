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
  initialValues?: AddAllocationInitialValues;
  onEditScheduleClick?: (params: {
    fromDate: string;
    toDate: string;
    hoursPerDay: number;
    recurrence: "one-time" | "recurring";
    repeatFor: number;
  }) => void;
}
