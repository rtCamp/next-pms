import type { AllocationRefreshTargets } from "../../types";
import type { AllocationOverrideEntry } from "../../utils";

export type AddAllocationLayoutVariant = "team" | "project";

export interface AddAllocationInitialValues {
  allocationName?: string;
  employeeId?: string;
  projectId?: string;
  customer?: string;
  recurrence?: "one-time" | "recurring";
  includeWeekends?: boolean;
  fromDate?: string;
  toDate?: string;
  hoursPerDay?: number;
  repeatFor?: number;
  isBillable?: boolean;
  isTentative?: boolean;
  note?: string;
  allocationStartDate?: string;
  allocationEndDate?: string;
  allocationHoursPerDay?: number;
  segmentStartDate?: string;
  segmentEndDate?: string;
  segmentHoursPerDay?: number;
  override?: AllocationOverrideEntry[];
  recurrenceId?: string;
}

export interface AddAllocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "add" | "edit";
  layoutVariant?: AddAllocationLayoutVariant;
  onEditScheduleClick?: () => void;
  initialValues?: AddAllocationInitialValues;
  onSuccess?: (targets?: AllocationRefreshTargets) => void | Promise<void>;
}

export type ComboboxOption = {
  value: string;
  label: string;
  customer?: string;
};
