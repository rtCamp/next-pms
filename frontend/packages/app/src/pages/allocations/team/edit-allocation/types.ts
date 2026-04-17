export type DayCellInteraction =
  | "default"
  | "hover"
  | "active"
  | "focus"
  | "selected"
  | "range"
  | "disabled"
  | "skeleton";

export interface EditScheduleDayCellData {
  id: string;
  dayName?: string;
  dayNumber?: string;
  monthShort?: string;
  monthLabel?: string;
  isNewMonth?: boolean;
  interaction: DayCellInteraction;
}

export interface EditScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromDate?: string;
  toDate?: string;
  initialHoursPerDay?: number;
  recurrence?: "one-time" | "recurring";
  repeatFor?: number;
}

export type ApplyEditsTo =
  | "this-allocation"
  | "this-and-future"
  | "all-occurrences";

export type SelectionRange = {
  startIndex: number;
  endIndex: number;
};

export type ScheduleSummarySegment = {
  startIndex: number;
  endIndex: number;
  daysCount: number;
  hoursPerDay: number;
};
