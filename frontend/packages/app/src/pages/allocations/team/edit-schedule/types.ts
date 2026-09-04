import type { AllocationOverrideEntry } from "@/pages/allocations/utils";
import type { AllocationRefreshTargets } from "../../types";

export type DayItem = {
  date: string;
  dayLabel: string;
  dayNumber: number;
  monthLabel?: string;
  isMonthBoundary: boolean;
  dayOffTooltip?: string;
};

export type PreviewRow = {
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  isSelected: boolean;
  isModified: boolean;
  dayOffLabel?: string;
};

export type DayAvailability = {
  availabilityFactor: number;
  isHoliday: boolean;
  holidayName?: string;
};

export type AvailabilityByDate = Record<string, DayAvailability>;

export type EmployeeAvailabilityResponse = {
  daily_working_hours: number;
  dates: Record<
    string,
    {
      availability_factor: number;
      available_hours: number;
      is_holiday: boolean;
      holiday_name?: string;
    }
  >;
};

export type NormalizedSelection = {
  startDate: string;
  endDate: string;
};

export type EditScheduleValueMode = "hoursPerDay" | "totalHours";
export type EditScheduleApplyMode = "only_this" | "this_and_future";

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
  allocationStartDate?: string;
  allocationEndDate?: string;
  allocationHoursPerDay?: number;
  isBillable?: boolean;
  isTentative?: boolean;
  includeWeekends?: boolean;
  note?: string;
  override?: AllocationOverrideEntry[];
  recurrenceId?: string;
}

export interface EditScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: EditScheduleInitialValues;
  onSuccess?: (targets?: AllocationRefreshTargets) => void | Promise<void>;
}
