/**
 * External dependencies
 */
import { useMemo, useState } from "react";
import { floatToTime } from "@next-pms/design-system";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  WeekRow as BaseWeekRow,
  statusMap,
} from "@next-pms/design-system/components";
import { getTodayDate, prettyDate } from "@next-pms/design-system/date";

/**
 * Internal dependencies
 */
import { calculateLeaveHours, calculateTotalHours, expectatedHours } from "@/lib/utils";
import type { WeekRowProps } from "./types";

/**
 * @description This is the week row component for the timesheet table.
 * It is responsible for rendering the week row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {TaskProps} props.tasks - TaskProps object containing task data for the week.
 * @param {Array} props.leaves - Array of LeaveProps containing leave data for the week.
 * @param {Array} props.holidays - Array of HolidayProp containing holiday data for the week.
 * @param {number} props.workingHour - Number of working hours in a day.
 * @param {WorkingFrequency} props.workingFrequency - Working frequency.
 * @param {React.ReactNode} props.children - Child components to be rendered inside the accordion content.
 */
export const WeekRow = ({
  dates,
  tasks,
  leaves,
  holidays,
  workingHour,
  workingFrequency,
  status,
  children,
  onButtonClick,
  collapsed: initialCollapsed,
  ...rest
}: WeekRowProps) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const dailyWorkingHours = expectatedHours(workingHour, workingFrequency);

  const formattedDates = useMemo(() => {
    return dates?.map((date: string) => prettyDate(date).date);
  }, [dates]);

  const weekData = useMemo(() => {
    let total = 0;
    const totalTimeEntries = [];
    for (const date of dates) {
      const holiday = holidays.find((holiday) => holiday.holiday_date === date);
      const currentTotal =
        calculateTotalHours(tasks, date) + calculateLeaveHours(leaves, date, dailyWorkingHours, holiday);
      totalTimeEntries.push(currentTotal === 0 ? "" : floatToTime(currentTotal, 2));
      total += currentTotal;
    }
    return { total, totalTimeEntries };
  }, [dates, tasks, leaves, holidays, dailyWorkingHours]);

  const today = useMemo(() => {
    const currentDate = getTodayDate();
    if (!dates.includes(currentDate)) {
      return "";
    }
    return prettyDate(currentDate).date;
  }, [dates]);

  const thisWeek = useMemo(() => {
    const todayIndex = dates.findIndex((date) => prettyDate(date).date === today);
    return todayIndex >= 0 && todayIndex < 7;
  }, [dates, today]);

  return (
    <Accordion value={collapsed ? [] : ["week"]} onValueChange={() => {}}>
      <AccordionItem value="week" className="border-none">
        <BaseWeekRow
          {...rest}
          today={today}
          thisWeek={thisWeek}
          dates={formattedDates}
          totalHours={floatToTime(weekData.total)}
          status={status ? statusMap[status] : "none"}
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          onButtonClick={() => (status && statusMap[status] === "not-submitted" ? onButtonClick?.() : undefined)}
        />
        <AccordionContent className="pb-0">
          {children?.({
            totalHours: floatToTime(weekData.total, 2),
            totalTimeEntries: weekData.totalTimeEntries,
            dailyWorkingHours,
            status: status ? statusMap[status] : "none",
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
