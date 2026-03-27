/**
 * External dependencies
 */
import { useMemo, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { floatToTime } from "@next-pms/design-system";
import {
  ApprovalStatusMap,
  MemberRow as BaseMemberRow,
  totalHoursThemeMap,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
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
            <div {...props}>
              <BaseMemberRow
                {...rest}
                avatarUrl={avatarUrl}
                collapsed={collapsed}
                status={status ? ApprovalStatusMap[status] : "none"}
                timeEntries={memberData.totalTimeEntries}
                totalHours={floatToTime(memberData.total, 2)}
                totalHoursTheme={totalHoursThemeMap[memberData.isExtended]}
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
