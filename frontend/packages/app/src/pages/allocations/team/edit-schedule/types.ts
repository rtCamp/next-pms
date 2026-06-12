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

export type NormalizedSelection = {
  startDate: string;
  endDate: string;
};

export type SelectedRange = {
  startDate: string | null;
  endDate: string | null;
};

export type EditScheduleValueMode = "hoursPerDay" | "totalHours";

export type EditScheduleDraft = {
  selection: NormalizedSelection | null;
  hasSelection: boolean;
  hoursPerDay: number;
  totalHours: number;
  previewRows: PreviewRow[];
  headerRangeLabel: string;
  hasMeaningfulChange: boolean;
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
