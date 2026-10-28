import type { FieldHelp } from "@/components/InfoHoverCard";

/** `team` lists employees with their projects below; `project` lists projects with their employees below. */
export type GanttGridVariant = "team" | "project";

/** Which allocations of a recurring series a delete applies to (the backend's values). */
export type DeleteAllocationMode =
  "only_this" | "this_and_future" | "all_in_series";

/** How much of a day is off: the whole day, its first or second half, or an unspecified half. */
export type TimeoffPortion = "full" | "first" | "second" | "half";

/** A day-level change to an allocation's hours. */
export interface AllocationOverride {
  /** The day, as `YYYY-MM-DD`. */
  date: string;
  hours?: number | null;
  cancelled?: number | null;
}

/**
 * One allocation segment as a bar: an allocation, or the part of one between per-day overrides.
 * Dates are local midnight; `endDate` is inclusive.
 */
export interface Allocation {
  /** The `Resource Allocation` the segment belongs to. */
  id?: string;
  employeeId?: string;
  projectId?: string;
  /** Shared by the allocations of a recurring series. */
  recurrenceId?: string;
  /** Hours per day. */
  hours: number;
  startDate: Date;
  endDate: Date;
  billable?: boolean;
  tentative?: boolean;
  isAiCreated?: boolean;
  /** Why the AI made the allocation. */
  aiReason?: string;
  note?: string;
  createdOn?: Date;
  updatedOn?: Date;
  updatedBy?: { name: string; image?: string };
  override?: AllocationOverride[];
  /** The allocation document's own start date, when the segment is part of it. */
  allocationStartDate?: Date;
  /** The allocation document's own end date. */
  allocationEndDate?: Date;
  /** The allocation document's own hours per day. */
  allocationHoursPerDay?: number;
  includeWeekends?: boolean;
  includeHolidays?: boolean;
  /** The placeholder segment of an allocation reduced to zero hours. */
  fullyReduced?: boolean;
}

/** Leave or a holiday. */
export interface LeaveAllocation {
  startDate: Date;
  /** Inclusive. */
  endDate: Date;
  /** The one day in the range taken as a half day. */
  halfDayDate?: Date;
  /** Which half of `halfDayDate` is off. */
  halfDayPortion?: "first" | "second";
  /** Shown instead of "N days off", e.g. a holiday's name. Marks the bar as a holiday. */
  label?: string;
}

/** A project row, or a project under an employee in the `team` variant. */
export interface GanttProject {
  id?: string;
  name: string;
  /** The allocation's dates, shown under the name. */
  dateRange?: string;
  /** The project's own dates, shown in its card; falls back to `dateRange`. */
  projectDateRange?: string;
  customer?: string;
  projectManager?: string;
  remainingHours?: number;
  badge?: string;
  allocations?: Allocation[];
}

/** An employee row in the `team` variant. */
export interface GanttEmployee {
  id?: string;
  name: string;
  image?: string;
  badge?: string;
  designation?: string;
  department?: string;
  /** Hourly rate, already formatted. */
  rate?: string;
  /** Capacity, already formatted, e.g. "40h / week". */
  capacity?: string;
  /** Hours a day the employee can be allocated; 8 when unset. */
  capacityHoursPerDay?: number;
  manager?: string;
  projects?: GanttProject[];
  leaves?: LeaveAllocation[];
}

/** An employee under a project in the `project` variant. */
export interface GanttProjectEmployee extends Omit<GanttEmployee, "projects"> {
  allocations?: Allocation[];
}

/** A project row in the `project` variant. */
export interface GanttProjectGroup extends Omit<GanttProject, "allocations"> {
  employees?: GanttProjectEmployee[];
}

/** What an add, edit or delete is about; every field the grid knows is filled in. */
export interface AllocationEventData {
  allocationId?: string;
  employeeId?: string;
  employeeName?: string;
  projectId?: string;
  recurrenceId?: string;
  projectName?: string;
  customerName?: string;
  /** For an add: the chosen range. For an edit: the segment's range, or the resized one. */
  startDate?: Date;
  endDate?: Date;
  hoursPerDay?: number;
  billable?: boolean;
  tentative?: boolean;
  isAiCreated?: boolean;
  aiReason?: string;
  note?: string;
  override?: AllocationOverride[];
  allocationStartDate?: Date;
  allocationEndDate?: Date;
  allocationHoursPerDay?: number;
  includeWeekends?: boolean;
  includeHolidays?: boolean;
  /** The segment's range and hours before the edit. */
  segmentStartDate?: Date;
  segmentEndDate?: Date;
  segmentHoursPerDay?: number;
  /** Call once the allocation is saved; removes the draft bar an add came from. */
  onSuccess?: () => void;
}

/** The allocation's summary as its card shows it, for the delete confirmation. */
export interface AllocationSummaryText {
  projectName: string;
  /** e.g. "Oct 19, 2026 – Oct 23, 2026". */
  dateRange: string;
  /** e.g. "8h/day". */
  hoursPerDay: string;
  /** e.g. "40 hours". */
  totalHours: string;
}

export interface GanttGridProps {
  variant: GanttGridVariant;
  /** Any day in the first week shown; weeks start on Monday. */
  startDate: Date;
  /** Number of weeks shown. */
  weekCount?: number;
  /** Rows of the `team` variant. */
  employees?: GanttEmployee[];
  /** Rows of the `project` variant. */
  projects?: GanttProjectGroup[];
  /** Title of the row header column, e.g. "Members". */
  rowHeaderLabel: string;
  /** Info card shown after the row header label, explaining the marks in the grid. */
  rowHeaderHelp?: FieldHelp;
  /** Tooltip on the hourly rate line of the employee card. */
  rateTooltip?: string;
  /** Tooltip on the working hours line of the employee card. */
  capacityTooltip?: string;
  /** Tooltip on the remaining hours line of the project card. */
  remainingHoursTooltip?: string;
  /** Tooltip on the hours line of each allocation in the allocation card. */
  hoursTooltip?: string;
  /** Show Saturday and Sunday columns; when false they are left out, not just shaded. */
  showWeekend?: boolean;
  /** The user may add, edit, resize and delete allocations, and open employee and project links. */
  hasRoleAccess?: boolean;
  /** The user may change AI-created allocations too. */
  canManageAiAllocations?: boolean;
  /** A page of rows is loading. */
  loading?: boolean;
  /** More rows can be loaded; while true, `loadMore` fires as the end of the rows scrolls into view. */
  hasMore?: boolean;
  /** Scrolls back to the top-left whenever it changes, e.g. a key built from the filters. */
  scrollResetKey?: string;
}

export interface GanttGridEmits {
  /** Add an allocation: from a row's add row or card (no dates), or from a draft bar (with dates and `onSuccess`). */
  add: [data: AllocationEventData];
  /** Edit an allocation: from its card, or Save after resizing its bar (with the new dates). */
  edit: [data: AllocationEventData];
  /** Delete an allocation from its card; the page confirms, asking for a mode when `recurrenceId` is set. */
  delete: [data: AllocationEventData, summary: AllocationSummaryText];
  /** A row was expanded or collapsed. */
  toggle: [rowKey: string, expanded: boolean];
  /** The end of the rows came into view and more can load. */
  loadMore: [];
}
