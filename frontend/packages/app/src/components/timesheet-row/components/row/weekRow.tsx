/**
 * External dependencies
 */
import { useMemo, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { floatToTime } from "@next-pms/design-system";
import {
  WeekRow as BaseWeekRow,
  ApprovalStatusMap,
  totalHoursThemeMap,
} from "@next-pms/design-system/components";
import { getTodayDate, prettyDate } from "@next-pms/design-system/date";

/**
 * Internal dependencies
 */
import {
  calculateExtendedWorkingHour,
  calculateLeaveHours,
  calculateTotalHours,
  calculateWeeklyHour,
  expectatedHours,
} from "@/lib/utils";
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
    const totalTimeEntries: { date: string; time: string }[] = [];
    const totalTimeEntriesInHours: number[] = [];
    for (const date of dates) {
      const holiday = holidays.find((holiday) => holiday.holiday_date === date);
      const currentTotal =
        calculateTotalHours(tasks, date) +
        calculateLeaveHours(leaves, date, dailyWorkingHours, holiday);
      totalTimeEntries.push({
        date,
        time: currentTotal === 0 ? "" : floatToTime(currentTotal, 2),
      });
      totalTimeEntriesInHours.push(currentTotal);
      total += currentTotal;
    }
    return { total, totalTimeEntries, totalTimeEntriesInHours };
  }, [dates, tasks, leaves, holidays, dailyWorkingHours]);

  const isExtended = calculateExtendedWorkingHour(
    weekData.total,
    calculateWeeklyHour(workingHour, workingFrequency),
    workingFrequency,
  );

  const today = useMemo(() => {
    const currentDate = getTodayDate();
    if (!dates.includes(currentDate)) {
      return "";
    }
    return prettyDate(currentDate).date;
  }, [dates]);

  const thisWeek = useMemo(() => {
    const todayIndex = dates.findIndex(
      (date) => prettyDate(date).date === today,
    );
    return todayIndex >= 0 && todayIndex < 7;
  }, [dates, today]);

  return (
    <Accordion.Root
      value={collapsed ? [] : ["week"]}
      onValueChange={(value) => {
        setCollapsed(value.length === 0);
      }}
    >
      <Accordion.Item value="week" className="border-none">
        <Accordion.Trigger
          nativeButton={false}
          render={(props) => (
            <div {...props}>
              <BaseWeekRow
                {...rest}
                today={today}
                thisWeek={thisWeek}
                dates={formattedDates}
                totalHours={floatToTime(weekData.total, 2)}
                totalHoursTheme={totalHoursThemeMap[isExtended]}
                status={status ? ApprovalStatusMap[status] : "none"}
                collapsed={collapsed}
                onButtonClick={() =>
                  status && ApprovalStatusMap[status] === "not-submitted"
                    ? onButtonClick?.()
                    : undefined
                }
              />
            </div>
          )}
        />
        <Accordion.Panel className="pb-0 accordion-panel">
          {children?.({
            totalHours: floatToTime(weekData.total, 2),
            totalHoursTheme: totalHoursThemeMap[isExtended],
            totalTimeEntries: weekData.totalTimeEntries,
            totalTimeEntriesInHours: weekData.totalTimeEntriesInHours,
            dailyWorkingHours,
            status: status ? ApprovalStatusMap[status] : "none",
          })}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
};
