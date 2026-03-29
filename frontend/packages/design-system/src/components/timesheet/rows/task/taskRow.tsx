/**
 * External dependencies.
 */
import { createRef, useRef } from "react";
import { Popover, PreviewCard } from "@base-ui/react";
import {
  TaskStatus,
  type TaskStatusType,
} from "@next-pms/design-system/components";
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus, Star } from "lucide-react";

/**
 * Internal dependencies.
 */
import { type TaskRowTimeEntry } from "./constants";
import { mergeClassNames as cn } from "../../../../utils";

export interface TaskRowProps {
  /** Label for the task row. */
  label: string;
  /** Whether the task row is starred. */
  starred?: boolean;
  /** Array of time entries for each day of the week for the task. */
  timeEntries: TaskRowTimeEntry[];
  /** Optional function to handle cell click events, receiving the task key and day index. */
  onCellClick?: (taskKey: string, dayIndex: number) => void;
  /** Optional function to handle star click events, receiving the task key. */
  onStarClick?: (
    e: React.MouseEvent<HTMLButtonElement>,
    taskKey: string,
  ) => void;
  /** Optional function to render inline time entry popover for a time entry, receiving the task key and day index. */
  renderInlineTimeEntryPopover?: (
    taskKey: string,
    dayIndex: number,
    closePopover: () => void,
  ) => React.ReactNode;
  /** Total hours logged for the week. */
  totalHours?: string;
  /** Status of the task row. */
  status?: TaskStatusType;
  /** Additional class names for the task row container. */
  className?: string;
  /** Optional function to render hover content for the task, receiving the task key. */
  renderTaskHoverContent?: (taskKey: string) => React.ReactNode;
  /** Optional function to handle label click events, receiving the task key. */
  onLabelClick?: (taskKey: string) => void;
  /** Key of the task, used for identifying the task in callbacks. */
  taskKey: string;
  /** Whether to hide the star button for liking the task. */
  hideStarButton?: boolean;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  label,
  starred = false,
  timeEntries,
  onCellClick,
  onStarClick,
  renderTaskHoverContent,
  renderInlineTimeEntryPopover,
  totalHours = "",
  status = "open",
  className,
  onLabelClick,
  taskKey,
  hideStarButton,
}) => {
  const actionRefs = useRef<
    Array<React.RefObject<Popover.Root.Actions | null>>
  >([]);
  return (
    <div
      className={cn(
        "flex justify-between items-center px-1 py-2 w-full border-b transition-colors border-outline-gray-1",
        className,
      )}
    >
      <div className="flex flex-1 items-center min-w-0 group">
        <div className="flex gap-2 items-center min-w-0">
          <TaskStatus status={status} />
          <span className="min-w-0 text-base font-medium truncate">
            <PreviewCard.Root>
              <PreviewCard.Trigger
                onClick={() => onLabelClick?.(taskKey)}
                className="cursor-pointer"
              >
                {label}
              </PreviewCard.Trigger>
              <PreviewCard.Portal>
                <PreviewCard.Positioner sideOffset={8} align="start">
                  <PreviewCard.Popup>
                    {renderTaskHoverContent?.(taskKey)}
                  </PreviewCard.Popup>
                </PreviewCard.Positioner>
              </PreviewCard.Portal>
            </PreviewCard.Root>
          </span>
          {!hideStarButton ? (
            <Button
              variant="ghost"
              className={cn(
                "w-4 h-4 bg-transparent hover:bg-transparent active:bg-transparent shrink-0 p-0",
                !starred &&
                  "transition-opacity duration-100 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
              )}
              onClick={(e) => onStarClick?.(e, taskKey)}
              aria-label={starred ? "Unstar task" : "Star task"}
              icon={() => (
                <Star
                  strokeWidth={1.5}
                  size={16}
                  className={cn(
                    starred
                      ? "fill-current text-ink-amber-2"
                      : "text-ink-gray-4",
                  )}
                />
              )}
            />
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
                    onClick={() => onCellClick?.(taskKey, index)}
                  />
                }
              >
                {timeEntry.time === "" ? (
                  <>
                    <span className="flex-1 text-center group-hover:hidden group-disabled:group-hover:flex text-ink-gray-4">
                      -
                    </span>
                    <span className="hidden absolute top-0 left-0 justify-center items-center w-full h-full group-hover:flex group-disabled:group-hover:hidden">
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
                      taskKey,
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

      <div className="w-12 h-7 shrink-0"></div>
    </div>
  );
};
