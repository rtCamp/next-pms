/**
 * External dependencies.
 */
import { addDays, format, isWeekend, parseISO } from "date-fns";

/**
 * Internal dependencies.
 */
import type { AvailabilityByDate } from "@/pages/allocations/types";
import { getReducingFactor } from "@/pages/allocations/utils";

/**
 * Sums how much of a working day each booked date is worth, across every weekly copy.
 */
const getEffectiveDayCount = ({
  fromDate,
  toDate,
  includeWeekends,
  includeHolidays,
  copies,
  availability,
}: {
  fromDate: string;
  toDate: string;
  includeWeekends: boolean;
  includeHolidays: boolean;
  copies: number;
  availability: AvailabilityByDate;
}): number => {
  const end = parseISO(toDate);
  let total = 0;

  for (let copy = 0; copy < copies; copy++) {
    for (let day = parseISO(fromDate); day <= end; day = addDays(day, 1)) {
      const booked = addDays(day, copy * 7);

      if (!includeWeekends && isWeekend(booked)) {
        continue;
      }

      total += getReducingFactor(
        availability[format(booked, "yyyy-MM-dd")],
        includeHolidays,
      );
    }
  }

  return total;
};

/**
 * Computes total allocated hours for both one-time and recurring modes, reduced on the
 * days the employee is away the same way the allocation is reduced on save.
 */
export const computeTotalHours = ({
  hoursPerDay,
  recurrence,
  fromDate,
  toDate,
  repeatFor = 0,
  includeWeekends = true,
  includeHolidays = false,
  availability = {},
}: {
  hoursPerDay?: number;
  recurrence: "one-time" | "recurring";
  fromDate?: string;
  toDate?: string;
  repeatFor?: number;
  includeWeekends?: boolean;
  includeHolidays?: boolean;
  availability?: AvailabilityByDate;
}): number => {
  const safeHoursPerDay = Number.isFinite(hoursPerDay)
    ? Number(hoursPerDay)
    : 0;
  const safeRepeatFor = Number.isFinite(repeatFor) ? Number(repeatFor) : 0;
  const safeFromDate = fromDate ?? "";
  const safeToDate = toDate ?? "";

  if (!safeFromDate || !safeToDate || safeFromDate > safeToDate) return 0;

  const dayCount = getEffectiveDayCount({
    fromDate: safeFromDate,
    toDate: safeToDate,
    includeWeekends,
    includeHolidays,
    copies: recurrence === "recurring" ? Math.max(0, safeRepeatFor) + 1 : 1,
    availability,
  });

  return Number((safeHoursPerDay * dayCount).toFixed(2));
};
