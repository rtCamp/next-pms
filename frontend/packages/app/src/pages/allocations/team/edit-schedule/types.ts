export type EditScheduleMode = "one-time" | "recurring";

export type ApplyEditsTo = "this-allocation" | "this-and-future";

export interface EditScheduleSeedBand {
  startDate: string;
  endDate: string;
  hoursPerDay: number;
  repeatForwardCount?: number;
}

export interface EditScheduleInitialValues {
  mode: EditScheduleMode;
  rangeStart: string;
  rangeEnd: string;
  recurringWeekCount?: number;
  applyEditsTo?: ApplyEditsTo;
  defaultHoursPerDay?: number;
  scheduleBands?: EditScheduleSeedBand[];
}

export interface EditSchedulePayload {
  mode: EditScheduleMode;
  applyEditsTo: ApplyEditsTo;
  recurringWeekCount?: number;
  totalHours: number;
  bands: EditScheduleSeedBand[];
}

export interface EditScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: EditScheduleInitialValues;
  onSave?: (payload: EditSchedulePayload) => void | Promise<void>;
}
