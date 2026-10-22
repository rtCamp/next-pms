import { dayjs } from "frappe-ui";
import type { AllocationEventData } from "@/components/GanttGrid";
import { formatISODate, parseISODate } from "./dateWindow";
import { isLeaveOwnedOverride, reducingFactor } from "./segments";
import type {
  AllocationOverrideEntry,
  AllocationRefreshTargets,
  AvailabilityByDate,
} from "./types";

export type AllocationRecurrence = "one-time" | "recurring";

export const RECURRENCE_OPTIONS: {
  label: string;
  value: AllocationRecurrence;
}[] = [
  { label: "One time", value: "one-time" },
  { label: "Recurring", value: "recurring" },
];

/** The Add / Edit allocation dialog's fields. */
export interface AllocationForm {
  employeeId: string;
  employeeLabel: string;
  projectId: string;
  projectLabel: string;
  /** The project's Customer id; the dialog shows its name. */
  customerId: string;
  customerLabel: string;
  recurrence: AllocationRecurrence;
  includeWeekends: boolean;
  includeHolidays: boolean;
  /** `YYYY-MM-DD`. */
  fromDate: string;
  toDate: string;
  hoursPerDay: number;
  /** Extra weekly copies of a recurring allocation; `null` while the field is empty. */
  repeatFor: number | null;
  isBillable: boolean;
  isTentative: boolean;
  note: string;
}

/** What the dialog knows about the allocation being edited, besides its fields. */
export interface AllocationFormContext {
  allocationId?: string;
  recurrenceId?: string;
  isAiCreated: boolean;
  aiReason?: string;
  override: AllocationOverrideEntry[];
  /** The allocation document's own range and hours, `YYYY-MM-DD`. */
  allocationStartDate?: string;
  allocationEndDate?: string;
  allocationHoursPerDay?: number;
  /** The employee and project the dialog opened with. */
  initialEmployeeId?: string;
  initialProjectId?: string;
}

export type AllocationFormErrors = Partial<
  Record<keyof AllocationForm, string>
>;

export function emptyAllocationForm(today = new Date()): AllocationForm {
  const date = formatISODate(today);
  return {
    employeeId: "",
    employeeLabel: "",
    projectId: "",
    projectLabel: "",
    customerId: "",
    customerLabel: "",
    recurrence: "one-time",
    includeWeekends: false,
    includeHolidays: false,
    fromDate: date,
    toDate: date,
    hoursPerDay: 0,
    repeatFor: 1,
    isBillable: true,
    isTentative: false,
    note: "",
  };
}

function isoDate(date: Date | undefined): string | undefined {
  return date ? formatISODate(date) : undefined;
}

/**
 * The dialog's fields and context for an add (from the header, a row or a draft bar) or
 * an edit (from a bar's card or a resize). A recurring or AI-made allocation is edited
 * whole, so it opens with its own range and hours rather than the segment's.
 */
export function formFromRequest(
  mode: "add" | "edit",
  data: AllocationEventData,
  customerId: string | undefined,
  today = new Date(),
): { form: AllocationForm; context: AllocationFormContext } {
  const empty = emptyAllocationForm(today);
  const customer = customerId ?? "";
  const shared = {
    employeeId: data.employeeId ?? "",
    employeeLabel: data.employeeName ?? data.employeeId ?? "",
    projectId: data.projectId ?? "",
    projectLabel: data.projectName ?? data.projectId ?? "",
    customerId: customer,
    customerLabel: customer ? (data.customerName ?? customer) : "",
  };
  const context: AllocationFormContext = {
    isAiCreated: false,
    override: [],
    initialEmployeeId: data.employeeId,
    initialProjectId: data.projectId,
  };
  if (mode === "add") {
    return {
      form: {
        ...empty,
        ...shared,
        fromDate: isoDate(data.startDate) ?? empty.fromDate,
        toDate: isoDate(data.endDate) ?? empty.toDate,
        hoursPerDay: data.hoursPerDay ?? empty.hoursPerDay,
      },
      context,
    };
  }

  const whole = Boolean(data.recurrenceId || data.isAiCreated);
  const start = whole
    ? (data.allocationStartDate ?? data.startDate)
    : data.startDate;
  const end = whole ? (data.allocationEndDate ?? data.endDate) : data.endDate;
  return {
    form: {
      ...empty,
      ...shared,
      recurrence: data.recurrenceId ? "recurring" : "one-time",
      fromDate: isoDate(start) ?? empty.fromDate,
      toDate: isoDate(end) ?? empty.toDate,
      hoursPerDay:
        (whole ? data.allocationHoursPerDay : undefined) ??
        data.hoursPerDay ??
        empty.hoursPerDay,
      isBillable: data.billable ?? empty.isBillable,
      // Approving makes it a confirmed allocation.
      isTentative: data.isAiCreated ? false : Boolean(data.tentative),
      includeWeekends: Boolean(data.includeWeekends),
      includeHolidays: Boolean(data.includeHolidays),
      note: data.note ?? "",
    },
    context: {
      ...context,
      allocationId: data.allocationId,
      recurrenceId: data.recurrenceId,
      isAiCreated: Boolean(data.isAiCreated),
      aiReason: data.aiReason,
      override: (data.override ?? []) as AllocationOverrideEntry[],
      allocationStartDate: isoDate(data.allocationStartDate ?? data.startDate),
      allocationEndDate: isoDate(data.allocationEndDate ?? data.endDate),
      allocationHoursPerDay: data.allocationHoursPerDay ?? data.hoursPerDay,
    },
  };
}

/** Which fields an edit may change. */
export interface AllocationEditLocks {
  isRecurringEdit: boolean;
  /** Employee, project, dates, weekends, billable, tentative and note are read-only. */
  isMetadataLocked: boolean;
  isHoursPerDayLocked: boolean;
  /** An AI allocation can still be approved as it is, though locked. */
  canApproveLocked: boolean;
  /** Some days were reduced for leave or a holiday. */
  hasLeaveOwnedOverrides: boolean;
}

/**
 * A recurring allocation, or one with day overrides (leave-derived ones included) that
 * isn't AI-made, is changed only through Edit schedule; an AI allocation with manual
 * overrides keeps its hours per day.
 */
export function allocationEditLocks(
  mode: "add" | "edit",
  context: AllocationFormContext,
): AllocationEditLocks {
  const editing = mode === "edit";
  const isRecurringEdit = editing && Boolean(context.recurrenceId);
  const hasOverrides = context.override.length > 0;
  const hasManualOverrides = context.override.some(
    (entry) => !isLeaveOwnedOverride(entry),
  );
  const isMetadataLocked =
    editing && (isRecurringEdit || (hasOverrides && !context.isAiCreated));
  return {
    isRecurringEdit,
    isMetadataLocked,
    isHoursPerDayLocked:
      isMetadataLocked ||
      (editing && context.isAiCreated && hasManualOverrides),
    canApproveLocked: context.isAiCreated && !isRecurringEdit,
    hasLeaveOwnedOverrides: context.override.some(isLeaveOwnedOverride),
  };
}

/** The React form's validation, with its messages. */
export function validateAllocationForm(
  form: AllocationForm,
): AllocationFormErrors {
  const errors: AllocationFormErrors = {};
  if (!form.employeeId.trim()) errors.employeeId = "Please select an employee.";
  if (!form.projectId.trim()) errors.projectId = "Please select a project.";
  if (!form.customerId.trim()) {
    errors.customerId = "This project doesn't have a customer set.";
  }
  if (!form.fromDate.trim()) {
    errors.fromDate = "Please select a start and end date.";
  } else if (!form.toDate.trim()) {
    errors.toDate = "Please select an end date.";
  } else if (form.fromDate > form.toDate) {
    errors.toDate = "End date must be on or after start date.";
  }
  if (!(form.hoursPerDay > 0)) errors.hoursPerDay = "Must be greater than 0.";
  if (
    form.recurrence === "recurring" &&
    (form.repeatFor === null ||
      !Number.isInteger(form.repeatFor) ||
      form.repeatFor < 1)
  ) {
    errors.repeatFor = "Must be at least 1.";
  }
  return errors;
}

/**
 * Total hours the allocation books, over every weekly copy: each booked day counts the
 * share of it the employee is available, as the allocation is reduced on save.
 */
export function computeTotalHours(options: {
  hoursPerDay: number;
  recurrence: AllocationRecurrence;
  fromDate: string;
  toDate: string;
  repeatFor: number | null;
  includeWeekends: boolean;
  includeHolidays: boolean;
  availability?: AvailabilityByDate;
}): number {
  const hours = Number.isFinite(options.hoursPerDay) ? options.hoursPerDay : 0;
  const from = parseISODate(options.fromDate);
  const to = parseISODate(options.toDate);
  if (!from || !to || from > to) return 0;
  const copies =
    options.recurrence === "recurring"
      ? Math.max(0, options.repeatFor ?? 0) + 1
      : 1;
  let days = 0;
  for (let copy = 0; copy < copies; copy++) {
    for (
      let day = dayjs(from);
      !day.isAfter(to, "day");
      day = day.add(1, "day")
    ) {
      const booked = day.add(copy, "week");
      const weekday = booked.day();
      if (!options.includeWeekends && (weekday === 0 || weekday === 6)) {
        continue;
      }
      days += reducingFactor(
        options.availability?.[booked.format("YYYY-MM-DD")],
        options.includeHolidays,
      );
    }
  }
  return Number((hours * days).toFixed(2));
}

/** The last day a recurring allocation's copies reach, for the availability lookup. */
export function lastBookedDate(form: AllocationForm): string {
  const to = parseISODate(form.toDate);
  if (!to) return "";
  const copies =
    form.recurrence === "recurring" ? Math.max(0, form.repeatFor ?? 0) : 0;
  return formatISODate(dayjs(to).add(copies, "week").toDate());
}

/** The `allocation` argument of `handle_allocation` and `edit_allocation`. */
export interface AllocationPayload {
  doctype: "Resource Allocation";
  employee: string;
  project: string | null;
  customer: string;
  allocation_start_date: string;
  allocation_end_date: string;
  hours_allocated_per_day: number;
  include_weekends: boolean;
  include_holidays: boolean;
  is_billable: number;
  status: "Confirmed" | "Tentative";
  /** Sent as 0 when an AI allocation is approved. */
  is_ai_created?: number;
  note: string;
}

export function allocationPayload(
  form: AllocationForm,
  context: AllocationFormContext,
): AllocationPayload {
  return {
    doctype: "Resource Allocation",
    employee: form.employeeId,
    project: form.projectId,
    customer: form.customerId,
    allocation_start_date: form.fromDate,
    allocation_end_date: form.toDate,
    hours_allocated_per_day: form.hoursPerDay,
    include_weekends: form.includeWeekends,
    include_holidays: form.includeHolidays,
    is_billable: Number(form.isBillable),
    status: form.isTentative ? "Tentative" : "Confirmed",
    ...(context.isAiCreated ? { is_ai_created: 0 } : {}),
    note: form.note ?? "",
  };
}

/** The employees and projects a save touched, before and after. */
export function formRefreshTargets(
  form: AllocationForm,
  context: AllocationFormContext,
): AllocationRefreshTargets | undefined {
  const unique = (values: (string | undefined)[]) => [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ];
  const employeeIds = unique([context.initialEmployeeId, form.employeeId]);
  const projectIds = unique([context.initialProjectId, form.projectId]);
  if (!employeeIds.length && !projectIds.length) return undefined;
  return {
    ...(employeeIds.length ? { employeeIds } : {}),
    ...(projectIds.length ? { projectIds } : {}),
  };
}
