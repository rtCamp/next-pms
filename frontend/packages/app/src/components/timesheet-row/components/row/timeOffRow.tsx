/**
 * External dependencies
 */
import { useMemo } from "react";
import { floatToTime, stripTags } from "@next-pms/design-system";
import { TimeOffRow as BaseTimeOffRow } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { calculateLeaveHours } from "@/lib/utils";
import type { TimeOffRowProps } from "./types";

/**
 * @description This is the time off row component for the timesheet table.
 * It is responsible for rendering the time off row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {Array} props.leaves - Array of leave objects for the week.
 * @param {Array} props.holidays - Array of holiday objects for the week.
 * @param {number} props.expectedHours - Expected working hours for the day.
 */
export const TimeOffRow = ({
  dates,
  leaves,
  holidays,
  expectedHours,
  ...rest
}: TimeOffRowProps) => {
  const timeOffData = useMemo(() => {
    let totalHours = 0;
    const totalTimeEntries = [];
    let hasVisibleHoliday = false;

    for (const date of dates) {
      const holiday = holidays.find((holiday) => holiday.holiday_date === date);
      const hour = calculateLeaveHours(leaves, date, expectedHours, holiday);
      const isNamedHoliday = Boolean(holiday && !holiday.weekly_off);
      hasVisibleHoliday = hasVisibleHoliday || isNamedHoliday;

      totalHours += hour;
      // A named holiday shows the daily working hours, but is never added to
      // any total.
      const displayHour = isNamedHoliday ? expectedHours : hour;
      totalTimeEntries.push({
        time: displayHour === 0 ? "" : floatToTime(displayHour, 2),
        holiday: Boolean(holiday),
        holidayDescription: stripTags(holiday?.description ?? ""),
      });
    }

    return {
      totalHours: floatToTime(totalHours, 2),
      totalTimeEntries,
      hasVisibleHoliday,
    };
  }, [dates, leaves, holidays, expectedHours]);

  if (timeOffData.totalHours === "00:00" && !timeOffData.hasVisibleHoliday) {
    return <></>;
  }

  return (
    <BaseTimeOffRow
      {...rest}
      totalHours={timeOffData.totalHours}
      timeOffEntries={timeOffData.totalTimeEntries}
    />
  );
};
