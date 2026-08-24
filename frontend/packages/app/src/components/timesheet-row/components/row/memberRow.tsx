/**
 * External dependencies
 */
import { useMemo, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { floatToTime, mergeClassNames as cn } from "@next-pms/design-system";
import {
  ApprovalStatusMap,
  MemberRow as BaseMemberRow,
  totalHoursThemeMap,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { isDateBackdateRestricted } from "@/pages/timesheet/utils";
import { MemberRowProps } from "./types";
import { computeRowData } from "../../utils";

export const MemberRow = ({
  dates,
  tasks,
  leaves,
  holidays,
  workingHour,
  workingFrequency,
  status,
  disabled,
  backdateRestrictedBefore,
  onButtonClick,
  children,
  avatarUrl,
  collapsed: initialCollapsed,
  ...rest
}: MemberRowProps) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const memberData = useMemo(() => {
    return computeRowData({
      dates,
      tasks,
      leaves,
      holidays,
      workingHour,
      workingFrequency,
    });
  }, [dates, tasks, leaves, holidays, workingHour, workingFrequency]);

  return (
    <Accordion.Root
      value={collapsed ? [] : ["member"]}
      onValueChange={(value) => {
        setCollapsed(value.length === 0);
      }}
    >
      <Accordion.Item value="member" className="border-none">
        <Accordion.Trigger
          nativeButton={false}
          render={(props) => (
            <div
              {...props}
              className={cn(
                props.className,
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-outline-gray-3",
              )}
            >
              <BaseMemberRow
                {...rest}
                avatarUrl={avatarUrl}
                collapsed={collapsed}
                status={status ? ApprovalStatusMap[status] : "none"}
                timeEntries={memberData.totalTimeEntries.map((timeEntry) => ({
                  ...timeEntry,
                  disabled:
                    disabled ||
                    timeEntry.disabled ||
                    isDateBackdateRestricted(
                      timeEntry.date,
                      backdateRestrictedBefore,
                    ),
                }))}
                onCellClick={
                  rest.onCellClick
                    ? (date) => rest.onCellClick?.(date)
                    : undefined
                }
                totalHours={floatToTime(memberData.total, 2)}
                totalHoursTheme={totalHoursThemeMap[memberData.isExtended]}
                onButtonClick={() => onButtonClick?.()}
              />
            </div>
          )}
        />
        <Accordion.Panel className="accordion-panel">
          {children?.({
            totalTimeEntriesInHours: memberData.totalTimeEntriesInHours,
            dailyWorkingHours: memberData.dailyWorkingHours,
          })}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
};
