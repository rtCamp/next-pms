export interface AddAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "add" | "edit";
  onEditScheduleClick?: (params: {
    fromDate: string;
    toDate: string;
    hoursPerDay: number;
    recurrence: "one-time" | "recurring";
    repeatFor: number;
  }) => void;
}

export type AllocationEmployeeOption = {
  value: string;
  label: string;
};

export type AllocationProjectOption = {
  value: string;
  label: string;
};
