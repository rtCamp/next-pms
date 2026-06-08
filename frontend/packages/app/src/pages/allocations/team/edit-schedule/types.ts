import type { AllocationOverrideEntry } from "@/pages/allocations/utils";
import type { AllocationRefreshTargets } from "../../types";

export type DayItem = {
  date: string;
  dayLabel: string;
  dayNumber: number;
  monthLabel?: string;
  isMonthBoundary: boolean;
};

export type DayItemWithSelection = DayItem & { isSelected: boolean };

export type PreviewRow = {
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  isSelected: boolean;
  isModified: boolean;
};

export type SelectedRange = {
  startDate: string | null;
  endDate: string | null;
};

export interface EditScheduleInitialValues {
  allocationName: string;
  employeeId?: string;
  projectId?: string;
  customer?: string;
  rangeStart: string;
  rangeEnd: string;
  defaultHoursPerDay: number;
  isBillable?: boolean;
  isTentative?: boolean;
  note?: string;
  override?: AllocationOverrideEntry[];
}

export interface EditScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: EditScheduleInitialValues;
  onSuccess?: (targets?: AllocationRefreshTargets) => void | Promise<void>;
}
