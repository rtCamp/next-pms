/**
 * External dependencies.
 */
import { CalendarX2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "../../../../utils";

export interface TimeOffRowProps {
  /** Label for the time-off row. */
  label?: string;
  /** Array of time-off entries for each day of the week. */
  timeOffEntries: { time: string; holiday: boolean }[];
  /** Total time-off hours logged for the week. */
  totalHours?: string;
  /** Optional icon to display next to the label. */
  renderPrefix?: () => React.ReactNode;
  /** Additional class names for the time-off row container. */
  className?: string;
}

export const TimeOffRow: React.FC<TimeOffRowProps> = ({
  label = "Time-off",
  timeOffEntries,
  totalHours = "",
  renderPrefix,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex items-center border-b border-outline-gray-1 transition-colors w-full justify-between px-1 py-2",
        className,
      )}
      data-testid="time-off-row"
    >
      <div className="flex items-center flex-1 min-w-0 gap-2 text-ink-gray-9">
        <span className="w-4 shrink-0">
          {renderPrefix ? (
            renderPrefix()
          ) : (
            <CalendarX2 strokeWidth={1.5} size={16} />
          )}
        </span>
        <span className="min-w-0 text-base font-medium truncate">{label}</span>
      </div>
      {timeOffEntries.map((timeOffEntry, index) => {
        return (
          <div
            key={index}
            className={cn(
              "shrink-0 flex justify-end items-center text-base whitespace-nowrap w-16 h-7 px-2 py-1.5 leading-3.5 lining-nums tabular-nums",
              timeOffEntry.holiday ? "text-ink-gray-4" : "text-ink-gray-6",
            )}
          >
            {timeOffEntry.time === "" ? (
              <span className="flex-1 ml-2 text-center text-ink-gray-4">-</span>
            ) : (
              <span>{timeOffEntry.time}</span>
            )}
          </div>
        );
      })}

      <div className="shrink-0 flex justify-end items-center text-base text-end font-medium text-ink-amber-4 whitespace-nowrap w-16 h-7 px-2 py-1.5 leading-3.5 lining-nums tabular-nums">
        <span>{totalHours}</span>
      </div>

      <div className="w-12 shrink-0 h-7"></div>
    </div>
  );
};
