export interface AddAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export type AllocationEmployeeOption = {
  value: string;
  label: string;
};

export type AllocationProjectOption = {
  value: string;
  label: string;
};
