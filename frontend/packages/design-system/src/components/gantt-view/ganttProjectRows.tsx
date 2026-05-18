/**
 * External dependencies.
 */
import React from "react";
import { AddMd } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { ADD_PROJECT_ROW_HEIGHT, CELL_HEIGHT } from "./constants";
import { GanttMemberItem } from "./ganttMemberItem";
import { GanttProjectItem } from "./ganttProjectItem";
import { useGanttStore } from "./ganttStore";
import { mergeClassNames as cn } from "../../utils";

interface GanttProjectRowsProps {
  projectInd: number;
}

export const GanttProjectRows: React.FC<GanttProjectRowsProps> = ({
  projectInd,
}) => {
  const {
    project,
    isExpanded,
    isNextExpanded,
    weeks,
    daysPerWeek,
    headerWidth,
    toggleRow,
  } = useGanttStore((s) => ({
    project: s.projects[projectInd],
    isExpanded: s.expandedRows.has(projectInd),
    isNextExpanded:
      !s.expandedRows.has(projectInd) && s.expandedRows.has(projectInd + 1),
    weeks: s.weeks,
    daysPerWeek: s.daysPerWeek,
    headerWidth: s.headerWidth,
    toggleRow: s.toggleRow,
  }));

  if (!project) return null;

  const hasMembers = Boolean(project.members?.length);
  const addMemberRowHeight = isExpanded ? ADD_PROJECT_ROW_HEIGHT : 0;

  return (
    <React.Fragment>
      <tr className="relative last:border-b border-outline-gray-1">
        <GanttProjectItem
          {...project}
          canExpand={hasMembers}
          isExpanded={isExpanded}
          showChevron={true}
          onToggle={() => {
            if (hasMembers) {
              toggleRow(projectInd);
            }
          }}
          style={{
            height: CELL_HEIGHT,
            width: headerWidth,
            minWidth: headerWidth,
          }}
        />
        {weeks.map((week, index) => (
          <td
            key={`${week}-${index}`}
            colSpan={daysPerWeek}
            className={cn("border-r border-outline-gray-1", {
              "border-b": isNextExpanded,
            })}
            style={{ height: CELL_HEIGHT }}
          />
        ))}
        <td
          aria-hidden="true"
          className="p-0 border-0 w-0 min-w-0 max-w-0"
          style={{ width: 0 }}
        />
      </tr>

      {project.members?.map((member) => (
        <tr
          key={member.id ?? member.name}
          className={cn("relative", { "pointer-events-none": !isExpanded })}
          aria-hidden={!isExpanded}
        >
          <GanttMemberItem
            member={member}
            isExpanded={false}
            canExpand={false}
            showChevron={false}
            className="pl-8 pr-3"
            style={{
              height: isExpanded ? CELL_HEIGHT : 0,
              width: headerWidth,
              minWidth: headerWidth,
              borderBottomWidth: isExpanded ? undefined : 0,
              borderRightWidth: isExpanded ? undefined : 0,
            }}
          />
          {weeks.map((week, index) => (
            <td
              key={`${week}-${index}`}
              colSpan={daysPerWeek}
              className={cn(
                "overflow-hidden transition-[height] duration-200 ease-in-out",
                { "border-r border-outline-gray-1": isExpanded },
              )}
              style={{ height: isExpanded ? CELL_HEIGHT : 0 }}
            />
          ))}
          <td
            aria-hidden="true"
            className="p-0 border-0 w-0 min-w-0 max-w-0"
            style={{ width: 0 }}
          />
        </tr>
      ))}

      <tr
        className={cn("relative", { "pointer-events-none": !isExpanded })}
        aria-hidden={!isExpanded}
      >
        <th
          className="sticky left-0 z-10 bg-surface-white border-b border-r border-outline-gray-1 pl-8 pr-3 font-normal text-left align-middle flex items-center gap-2 w-full overflow-hidden transition-[height] duration-200 ease-in-out"
          style={{
            width: headerWidth,
            minWidth: headerWidth,
            height: addMemberRowHeight,
            borderBottomWidth: isExpanded ? undefined : 0,
            borderRightWidth: isExpanded ? undefined : 0,
          }}
        >
          <button
            type="button"
            onClick={() => {}}
            tabIndex={isExpanded ? undefined : -1}
            className="w-full h-full flex items-center gap-2 text-base font-medium text-ink-gray-9 overflow-hidden"
          >
            <AddMd className="size-4 shrink-0" />
            <span className="truncate">Add member</span>
          </button>
        </th>
        {weeks.map((week, index) => (
          <td
            key={`${week}-${index}`}
            colSpan={daysPerWeek}
            className={cn(
              "overflow-hidden transition-[height] duration-200 ease-in-out",
              { "border-r border-b border-outline-gray-1": isExpanded },
            )}
            style={{ height: addMemberRowHeight }}
          />
        ))}
        <td
          aria-hidden="true"
          className="p-0 border-0 w-0 min-w-0 max-w-0"
          style={{ width: 0 }}
        />
      </tr>
    </React.Fragment>
  );
};
