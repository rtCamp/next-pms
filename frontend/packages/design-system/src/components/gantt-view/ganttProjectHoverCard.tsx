/**
 * External dependencies.
 */
import {
  Calendar,
  Folder,
  People,
  Time,
  User,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { GanttOpenLink } from "./ganttOpenLink";
import type { Project } from "./types";
import { formatHours, getProjectHref } from "./utils";
import { mergeClassNames as cn } from "../../utils";

interface GanttProjectHoverCardProps {
  project: Project;
  canOpenProject?: boolean;
}

function GanttProjectHoverCard({
  project,
  canOpenProject = false,
}: GanttProjectHoverCardProps) {
  const dateRange = project.projectDateRange ?? project.dateRange;
  const remainingHoursLabel =
    project.remainingHours !== undefined
      ? `${formatHours(project.remainingHours)}h remaining`
      : undefined;
  const hasDetails =
    project.client ||
    dateRange ||
    remainingHoursLabel ||
    project.projectManager;
  const projectHref =
    canOpenProject && project.id ? getProjectHref(project.id) : undefined;

  return (
    <div className="flex flex-col gap-3 p-3 w-72 rounded-xl shadow-2xl bg-surface-modal animate-fade-in">
      <div
        className={cn("flex items-start gap-3", {
          "justify-between": projectHref,
        })}
      >
        <div className="flex gap-2 items-center min-w-0">
          <Folder className="size-4 text-ink-gray-8 shrink-0" />
          <span className="text-base font-medium truncate text-ink-gray-7">
            {project.name}
          </span>
        </div>
        {projectHref && (
          <GanttOpenLink href={projectHref} label="Open project" />
        )}
      </div>

      {hasDetails && <div className="w-full h-px bg-surface-gray-3 shrink-0" />}

      {hasDetails && (
        <div className="flex flex-col gap-2.5">
          {project.client && (
            <div className="flex gap-2 items-center">
              <People className="size-4 text-ink-gray-6 shrink-0" />
              <span className="text-sm text-ink-gray-6 truncate">
                {project.client}
              </span>
            </div>
          )}
          {dateRange && (
            <div className="flex gap-2 items-center">
              <Calendar className="size-4 text-ink-gray-6 shrink-0" />
              <span className="text-sm text-ink-gray-6 truncate">
                {dateRange}
              </span>
            </div>
          )}
          {remainingHoursLabel && (
            <div className="flex gap-2 items-center">
              <Time className="size-4 text-ink-gray-6 shrink-0" />
              <span className="text-sm text-ink-gray-6 truncate">
                {remainingHoursLabel}
              </span>
            </div>
          )}
          {project.projectManager && (
            <div className="flex gap-2 items-center">
              <User className="size-4 text-ink-gray-6 shrink-0" />
              <span className="text-sm text-ink-gray-6 truncate">
                {project.projectManager}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GanttProjectHoverCard;
