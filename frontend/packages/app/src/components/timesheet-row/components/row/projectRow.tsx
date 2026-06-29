/**
 * External dependencies
 */
import { useMemo, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { floatToTime } from "@next-pms/design-system";
import { ProjectRow as BaseProjectRow } from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { calculateTotalHours } from "@/lib/utils";
import type { ProjectRowProps } from "./types";
import { hasApprovedTimeEntry } from "../../utils";

/**
 * @description This is the project row component for the timesheet table.
 * It is responsible for rendering the project row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {TaskProps} props.tasks - TaskProps object containing task data for the week.
 * @param {boolean} props.hideTime - Optional flag to hide time entries in the row.
 * @param {React.ReactNode} props.children - Child components to be rendered inside the accordion content.
 */
export const ProjectRow = ({
  dates,
  tasks,
  hideTime,
  disabled,
  lockApproved = true,
  onCellClick,
  children,
  ...rest
}: ProjectRowProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const projectData = useMemo(() => {
    let total = 0;
    const totalTimeEntries: { time: string; disabled: boolean }[] = [];

    if (hideTime) {
      return { total, totalTimeEntries };
    }

    for (const date of dates) {
      const currentTotal = calculateTotalHours(tasks, date);
      totalTimeEntries.push({
        time: currentTotal === 0 ? "" : floatToTime(currentTotal, 2),
        disabled:
          Boolean(disabled) ||
          (lockApproved && hasApprovedTimeEntry(tasks, date)),
      });
      total += currentTotal;
    }
    return { total, totalTimeEntries };
  }, [dates, tasks, hideTime, disabled, lockApproved]);

  return (
    <Accordion.Root
      value={collapsed ? [] : ["project"]}
      onValueChange={(value) => setCollapsed(value.length === 0)}
    >
      <Accordion.Item value="project" className="border-none">
        <Accordion.Trigger
          nativeButton={false}
          render={(props) => (
            <div {...props}>
              <BaseProjectRow
                {...rest}
                totalHours={hideTime ? "" : floatToTime(projectData.total, 2)}
                timeEntries={projectData.totalTimeEntries}
                onCellClick={
                  hideTime
                    ? undefined
                    : (dayIndex) => onCellClick?.(dates[dayIndex] ?? "")
                }
                collapsed={collapsed}
                totalHoursTheme="green"
              />
            </div>
          )}
        />
        <Accordion.Panel className="pb-0 accordion-panel">
          {children}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
};
