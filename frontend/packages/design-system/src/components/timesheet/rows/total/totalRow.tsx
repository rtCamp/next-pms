/**
 * External dependencies.
 */
import {
  Breadcrumbs,
  Button,
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
  disabled = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center border-b border-outline-gray-1 transition-colors w-full justify-between px-1 py-2",
        className,
      )}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="flex items-center min-w-0 gap-2 text-ink-gray-9">
          <span className="flex items-center justify-center w-4 shrink-0">
            {renderPrefix ? (
              renderPrefix()
            ) : starred ? (
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
            )}
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
                  <span className="hidden absolute top-0 left-0 justify-center items-center w-full h-full group-hover:flex group-disabled:group-hover:hidden">
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

      <div className="w-12 shrink-0 h-7"></div>
    </div>
  );
};
