/**
 * External dependencies
 */
import { useMemo } from "react";
import { floatToTime } from "@next-pms/design-system";
import { TimeOffRow as BaseTimeOffRow } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { LeaveProps } from "@/types/timesheet";
import type { TimeOffRowProps } from "./types";

/**
 * @description This is the time off row component for the timesheet table.
 * It is responsible for rendering the time off row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {Array} props.leaves - Array of leave objects for the week.
 * @param {Array} props.holidayList - Array of holiday date strings for the week.
 * @param {number} props.expectedHours - Expected working hours for the day.
 */
export const TimeOffRow = ({
  dates,
  leaves,
  holidayList,
  expectedHours,
  ...rest
}: TimeOffRowProps) => {
  const timeOffData = useMemo(() => {
    let totalHours = 0;
    const totalTimeEntries = [];

    for (const date of dates) {
      let hour = 0;
      const data = leaves.filter((data: LeaveProps) => {
        return date >= data.from_date && date <= data.to_date;
      });

      if (holidayList.includes(date)) {
        const is_lwp = data.some((item: LeaveProps) => item.is_lwp);
        if (is_lwp) {
          hour = expectedHours;
          totalHours += hour;
          totalTimeEntries.push({
            time: hour === 0 ? "" : floatToTime(hour, 2),
            holiday: true,
          });
          continue;
        }
        continue;
      }

      for (const item of data) {
        if (
          item.half_day &&
          item.half_day_date &&
          item.half_day_date === date
        ) {
          hour += expectedHours / 2;
        } else {
          hour += expectedHours;
        }
      }
      totalHours += hour;
      totalTimeEntries.push({
        time: hour === 0 ? "" : floatToTime(hour, 2),
        holiday: false,
      });
    }

    return { totalHours: floatToTime(totalHours, 2), totalTimeEntries };
  }, [dates, leaves, holidayList, expectedHours]);

  if (timeOffData.totalHours === "00:00") {
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
