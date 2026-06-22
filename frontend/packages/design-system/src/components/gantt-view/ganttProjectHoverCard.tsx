/**
 * External dependencies.
 */
import {
  ArrowUpRight,
  Calendar,
  Folder,
  People,
  Time,
  User,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { Project } from "./types";
import { formatHours } from "./utils";

interface GanttProjectHoverCardProps {
  project: Project;
}

function GanttProjectHoverCard({ project }: GanttProjectHoverCardProps) {
  const dateRange = project.projectDateRange ?? project.dateRange;
  const weeklyCapacityLabel =
    project.weeklyCapacity !== undefined
      ? `${formatHours(project.weeklyCapacity)}h/week`
      : undefined;
  const hasDetails =
    project.client ||
    dateRange ||
    weeklyCapacityLabel ||
    project.projectManager;

  return (
    <div className="flex flex-col gap-3 p-3 w-72 rounded-xl shadow-2xl bg-surface-modal">
      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-2 items-center min-w-0">
          <Folder className="size-4 text-ink-gray-8 shrink-0" />
          <span className="text-base font-medium truncate text-ink-gray-7">
            {project.name}
          </span>
        </div>
        {project.id && (
          <a
            href={`/next-pms/projects/${encodeURIComponent(project.id)}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Open project"
            className="shrink-0 text-ink-gray-6 hover:text-ink-gray-8"
            onClick={(event) => event.stopPropagation()}
          >
            <ArrowUpRight className="size-4 text-ink-gray-8 shrink-0" />
          </a>
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
          {weeklyCapacityLabel && (
            <div className="flex gap-2 items-center">
              <Time className="size-4 text-ink-gray-6 shrink-0" />
              <span className="text-sm text-ink-gray-6 truncate">
                {weeklyCapacityLabel}
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
