/**
 * External dependencies.
 */
import { Button } from "@rtcamp/frappe-ui-react";
import { AddMd, SmallDown, Folder } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "../../../../utils";
import { type TotalHoursTheme, totalHoursVariants } from "../constants";

export interface ProjectRowProps {
  /** Label for the project row. */
  label?: string;
  /** Whether the project row is collapsed or expanded. */
  collapsed?: boolean;
  /** Array of time entries for each day of the week for the project. */
  timeEntries: string[];
  /** Total hours logged for the week. */
  totalHours?: string;
  /** Theme for the total hours */
  totalHoursTheme?: TotalHoursTheme;
  /** Optionally highlight time entries **/
  highlightTimeEntries?: boolean;
  /** Optional function to handle day-cell click events. */
  onCellClick?: (dayIndex: number) => void;
  /** Optional function to render a prefix icon next to the label. */
  renderPrefix?: () => React.ReactNode;
  /** Additional class names for the project row container. */
  className?: string;
}

export const ProjectRow: React.FC<ProjectRowProps> = ({
  label,
  collapsed = false,
  timeEntries,
  totalHours = "",
  totalHoursTheme,
  highlightTimeEntries = false,
  onCellClick,
  renderPrefix,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center border-b border-outline-gray-1 transition-colors w-full justify-between px-1 py-2",
        className,
      )}
    >
      <div className="flex items-center flex-1 min-w-0 gap-2">
        <span
          className={cn(
            "w-4 shrink-0 transition-transform",
            collapsed ? "-rotate-90" : "rotate-0",
          )}
        >
          <SmallDown strokeWidth={1.5} size={16} />
        </span>
        <div className="flex items-center min-w-0 gap-2 text-ink-gray-8">
          <span className="shrink-0">
            {renderPrefix ? (
              renderPrefix()
            ) : (
              <Folder strokeWidth={1.5} size={16} />
            )}
          </span>
          <span className="min-w-0 text-base font-medium truncate">
            {label}
          </span>
        </div>
      </div>
      {timeEntries.map((timeEntry, index) => {
        return (
          <div
            key={`${timeEntry}-${index}`}
            className="shrink-0 flex justify-end items-center whitespace-nowrap w-16 h-7 pl-2 py-1.5 lining-nums tabular-nums"
          >
            <Button
              variant="ghost"
              className={cn(
                "w-14.25 relative group flex justify-center items-center enabled:hover:bg-surface-gray-2",
                "enabled:focus:bg-surface-gray-2 enabled:active:bg-surface-gray-3 disabled:cursor-default!",
                "lining-nums tabular-nums [&_span]:overflow-visible [&_span]:whitespace-normal",
                "text-base text-ink-gray-6",
                highlightTimeEntries && timeEntry !== "" && "text-ink-gray-8",
                highlightTimeEntries && timeEntry !== "" && "font-medium",
              )}
              disabled={!onCellClick}
              onClick={(e) => {
                e.stopPropagation();
                onCellClick?.(index);
              }}
              aria-label="Add time"
            >
              {timeEntry === "" ? (
                <>
                  <span className="flex-1 text-center group-hover:hidden group-disabled:group-hover:flex text-ink-gray-4">
                    -
                  </span>
                  <span className="hidden absolute top-0 left-0 justify-center items-center w-full h-full group-hover:flex group-disabled:group-hover:hidden text-ink-gray-6">
                    <AddMd size={16} />
                  </span>
                </>
              ) : (
                <span>{timeEntry}</span>
              )}
            </Button>
          </div>
        );
      })}

      <div className="shrink-0 flex justify-end items-center text-base text-end font-medium text-ink-gray-5 whitespace-nowrap w-16 h-7 px-2 py-1.5">
        <span
          className={cn(
            totalHoursVariants({ theme: totalHoursTheme, weight: "default" }),
          )}
        >
          {totalHours}
        </span>
      </div>

      <div className="w-12 shrink-0 h-7"></div>
    </div>
  );
};
