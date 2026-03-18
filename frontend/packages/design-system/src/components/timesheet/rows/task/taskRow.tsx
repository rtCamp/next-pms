/**
 * External dependencies.
 */
import { createRef, useRef } from "react";
import { Popover } from "@base-ui/react";
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus, Star } from "lucide-react";

/**
 * Internal dependencies.
 */
import {
  statusIcon,
  statusIconVariants,
  type TaskRowTimeEntry,
  type TaskStatus,
} from "./constants";
import { mergeClassNames as cn } from "../../../../utils";

export interface TaskRowProps {
  /** Optional index of the task, used for identifying the task in callbacks. */
  taskIndex?: number;
  /** Label for the task row. */
  label?: string;
  /** Whether the task row is starred. */
  starred?: boolean;
  /** Array of time entries for each day of the week for the task. */
  timeEntries: TaskRowTimeEntry[];
  /** Optional function to handle cell click events, receiving the task index and day index. */
  onCellClick?: (taskIndex: number | undefined, dayIndex: number) => void;
  /** Optional function to render inline time entry popover for a time entry, receiving the task index and day index. */
  renderInlineTimeEntryPopover?: (
    taskIndex: number | undefined,
    dayIndex: number,
    closePopover: () => void,
  ) => React.ReactNode;
  /** Total hours logged for the week. */
  totalHours?: string;
  /** Status of the task row. */
  status?: TaskStatus;
  /** Additional class names for the task row container. */
  className?: string;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  taskIndex,
  label,
  starred = false,
  timeEntries,
  onCellClick,
  renderInlineTimeEntryPopover,
  totalHours = "",
  status = "open",
  className,
}) => {
  const StatusIcon = statusIcon[status];
  const actionRefs = useRef<
    Array<React.RefObject<Popover.Root.Actions | null>>
  >([]);
  return (
    <div
      className={cn(
        "flex items-center border-b border-outline-gray-1 transition-colors w-full justify-between px-1 py-2",
        className,
      )}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="flex items-center min-w-0 gap-2">
          <span className="w-4 shrink-0">
            <StatusIcon
              strokeWidth={1.5}
              size={16}
              className={statusIconVariants({ status })}
            />
          </span>
          <span className="min-w-0 text-base font-medium truncate">
            {label}
          </span>
          {starred ? (
            <span className="w-4 shrink-0">
              <Star
                strokeWidth={1.5}
                size={16}
                className="fill-current text-ink-amber-2"
              />
            </span>
          ) : null}
        </div>
      </div>
      {timeEntries.map((timeEntry, index) => {
        if (!actionRefs.current[index]) {
          actionRefs.current[index] = createRef<Popover.Root.Actions | null>();
        }
        const actionsRef = actionRefs.current[index];
        const closePopover = () => actionsRef.current?.close();

        return (
          <div
            key={index}
            className="shrink-0 flex justify-end items-center text-base text-ink-gray-6 whitespace-nowrap w-16 h-7 pl-2 py-1.5 leading-3.5"
          >
            <Popover.Root actionsRef={actionsRef}>
              <Popover.Trigger
                openOnHover
                render={
                  <Button
                    variant="ghost"
                    className="w-14.25 relative group flex justify-center items-center enabled:hover:bg-surface-gray-2 enabled:focus:bg-surface-gray-2 enabled:active:bg-surface-gray-3 disabled:cursor-default! lining-nums tabular-nums [&_span]:overflow-visible [&_span]:whitespace-normal"
                    disabled={timeEntry.disabled}
                    onClick={() => onCellClick?.(taskIndex, index)}
                  />
                }
              >
                {timeEntry.time === "" ? (
                  <>
                    <span className="flex-1 text-center group-hover:hidden group-disabled:group-hover:flex text-ink-gray-4">
                      -
                    </span>
                    <span className="absolute top-0 left-0 items-center justify-center hidden w-full h-full group-hover:flex group-disabled:group-hover:hidden">
                      <Plus strokeWidth={1.5} size={16} className="" />
                    </span>
                  </>
                ) : (
                  <span>{timeEntry.time}</span>
                )}
                {timeEntry.nonBillable ? (
                  <span className="block absolute z-10 -bottom-0.5 left-1/2 w-1 h-1 rounded-full bg-surface-amber-3 transform -translate-x-1/2"></span>
                ) : null}
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner sideOffset={8} align="end">
                  <Popover.Popup>
                    {renderInlineTimeEntryPopover?.(
                      taskIndex,
                      index,
                      closePopover,
                    )}
                  </Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        );
      })}

      <div className="shrink-0 flex justify-end items-center text-base text-end text-ink-gray-6 whitespace-nowrap w-16 h-7 px-2 py-1.5 lining-nums tabular-nums">
        <span>{totalHours}</span>
      </div>

      <div className="w-12 shrink-0 h-7"></div>
    </div>
  );
};
