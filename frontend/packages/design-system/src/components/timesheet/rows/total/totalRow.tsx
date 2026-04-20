/**
 * External dependencies.
 */
import {
  Breadcrumbs,
  Button,
  Tooltip,
  type BreadcrumbsProps,
} from "@rtcamp/frappe-ui-react";
import { Plus, Star, StarOff } from "lucide-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "../../../../utils";
import { type TotalHoursTheme, totalHoursVariants } from "../constants";

export interface TotalRowProps {
  /** Props configuration for the Breadcrumbs component displayed in the total row. */
  breadcrumbs: BreadcrumbsProps;
  /** Whether the total row is starred or not. */
  starred?: boolean;
  /** Array of total time entries for each day of the week. */
  totalTimeEntries: { date: string; time: string }[];
  /** Total hours logged for the week. */
  totalHours?: string;
  /** Theme for the total hours */
  totalHoursTheme?: TotalHoursTheme;
  /** Optional function to render a prefix icon next to the breadcrumbs. */
  renderPrefix?: () => React.ReactNode;
  /** Optional function to handle cell click events, receiving the date of the clicked cell. */
  onCellClick?: (date: string) => void;
  /** Optional function to handle star click events for importing/clearing liked tasks. */
  onStarClick?: () => void;
  /** Whether the cells in the total row are disabled */
  disabled?: boolean;
  /** Additional class names for the total row container. */
  className?: string;
}

export const TotalRow: React.FC<TotalRowProps> = ({
  breadcrumbs,
  starred = false,
  totalTimeEntries,
  totalHours = "",
  totalHoursTheme,
  renderPrefix,
  onCellClick,
  onStarClick,
  disabled = false,
  className,
}) => {
  const starTooltipText = starred
    ? "Clear imported tasks"
    : "Import liked tasks to this week";

  const renderStarIcon = () => {
    if (renderPrefix) {
      return renderPrefix();
    }

    const starIcon = starred ? (
      <Star
        strokeWidth={1.5}
        size={16}
        className="fill-current text-ink-amber-2"
      />
    ) : (
      <StarOff
        strokeWidth={1.5}
        size={16}
        className="text-ink-gray-4 scale-x-[-1]"
      />
    );

    if (onStarClick) {
      return (
        <Tooltip text={starTooltipText}>
          <button
            type="button"
            onClick={onStarClick}
            className="flex justify-center items-center w-4 h-4 rounded transition-colors cursor-pointer hover:bg-surface-gray-2"
            aria-label={starTooltipText}
          >
            {starIcon}
          </button>
        </Tooltip>
      );
    }

    return starIcon;
  };

  return (
    <div
      className={cn(
        "flex justify-between items-center px-1 py-2 w-full border-b transition-colors border-outline-gray-1",
        className,
      )}
    >
      <div className="flex flex-1 items-center min-w-0">
        <div className="flex gap-2 items-center min-w-0 text-ink-gray-9">
          <span className="flex justify-center items-center w-4 shrink-0">
            {renderStarIcon()}
          </span>
          <Breadcrumbs compactCrumbs={false} {...breadcrumbs} />
        </div>
      </div>

      {totalTimeEntries.map((totalTimeEntry, index) => {
        return (
          <div
            key={index}
            className="shrink-0 flex justify-end items-center whitespace-nowrap w-16 h-7 pl-2 py-1.5 leading-3.5 lining-nums tabular-nums"
          >
            <Button
              variant="ghost"
              className={cn(
                "w-14.25 relative group flex justify-center items-center enabled:hover:bg-surface-gray-2 ",
                "enabled:focus:bg-surface-gray-2 enabled:active:bg-surface-gray-3 disabled:cursor-default!",
                "lining-nums tabular-nums [&_span]:overflow-visible [&_span]:whitespace-normal",
                "text-base font-medium text-ink-gray-9",
              )}
              disabled={disabled || !onCellClick}
              onClick={() => onCellClick?.(totalTimeEntry.date)}
              aria-label="Add time"
            >
              {totalTimeEntry.time === "" ? (
                <>
                  <span className="flex-1 text-center group-hover:hidden group-disabled:group-hover:flex text-ink-gray-4">
                    -
                  </span>
                  <span className="hidden absolute top-0 left-0 justify-center items-center w-full h-full group-hover:flex group-disabled:group-hover:hidden text-ink-gray-6">
                    <Plus strokeWidth={1.5} size={16} className="" />
                  </span>
                </>
              ) : (
                <span>{totalTimeEntry.time}</span>
              )}
            </Button>
          </div>
        );
      })}

      <div className="shrink-0 flex justify-end items-center text-base font-medium text-end text-ink-gray-5 whitespace-nowrap w-16 h-7 px-2 py-1.5">
        <span className={cn(totalHoursVariants({ theme: totalHoursTheme }))}>
          {totalHours}
        </span>
      </div>

      <div className="w-12 h-7 shrink-0"></div>
    </div>
  );
};
