/**
 * External dependencies
 */
import { useMemo, useState } from "react";
import { floatToTime } from "@next-pms/design-system";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ProjectRow as BaseProjectRow,
} from "@next-pms/design-system/components";

/**
 * Internal dependencies
 */
import { calculateTotalHours } from "@/lib/utils";
import type { ProjectRowProps } from "./types";

/**
 * @description This is the project row component for the timesheet table.
 * It is responsible for rendering the project row of the timesheet table.
 *
 * @param {Array} props.dates - Array of date strings for the week.
 * @param {TaskProps} props.tasks - TaskProps object containing task data for the week.
 * @param {React.ReactNode} props.children - Child components to be rendered inside the accordion content.
 */
export const ProjectRow = ({
  dates,
  tasks,
  children,
  ...rest
}: ProjectRowProps) => {
  const [collapsed, setCollapsed] = useState(false);

  const projectData = useMemo(() => {
    let total = 0;
    const totalTimeEntries = [];
    for (const date of dates) {
      const currentTotal = calculateTotalHours(tasks, date);
      totalTimeEntries.push(
        currentTotal === 0 ? "" : floatToTime(currentTotal, 2),
      );
      total += currentTotal;
    }
    return { total, totalTimeEntries };
  }, [dates, tasks]);

  return (
    <Accordion
      value={collapsed ? [] : ["project"]}
      onValueChange={(value) => setCollapsed(value.length === 0)}
    >
      <AccordionItem value="project" className="border-none">
        <AccordionTrigger>
          <BaseProjectRow
            {...rest}
            totalHours={floatToTime(projectData.total, 2)}
            timeEntries={projectData.totalTimeEntries}
            collapsed={collapsed}
          />
        </AccordionTrigger>
        <AccordionContent className="pb-0">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
