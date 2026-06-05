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

export interface EditScheduleSeedBand {
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  repeatForwardCount?: number;
}

export interface EditScheduleInitialValues {
  rangeStart: string;
  rangeEnd: string;
  defaultHoursPerDay?: number;
}

export interface EditSchedulePayload {
  totalHours: number;
  bands: EditScheduleSeedBand[];
}

export interface EditScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: EditScheduleInitialValues;
  onSave?: (payload: EditSchedulePayload) => void | Promise<void>;
}
