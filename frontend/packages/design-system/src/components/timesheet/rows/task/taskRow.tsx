/**
 * External dependencies.
 */
import { useCallback, useRef, useState } from "react";
import { Popover, PreviewCard } from "@base-ui/react";
import {
  TaskStatus,
  type TaskStatusType,
} from "@next-pms/design-system/components";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddMd, Star, SolidStar } from "@rtcamp/frappe-ui-react/icons";

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
    reportEngaged: (engaged: boolean) => void,
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
  /** Guard for intentional popover dismissals */
  requestGuarded?: (action: () => void) => void;
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
  requestGuarded = (action) => action(),
}) => {
  const [handle] = useState(() => Popover.createHandle<{ dayIndex: number }>());
  // Once the user starts editing, the popover stays put on pointer/focus drift
  // and a backdrop catches outside clicks until they dismiss it.
  const pinnedRef = useRef(false);
  const [pinned, setPinned] = useState(false);

  const reportEngaged = useCallback((engaged: boolean) => {
    pinnedRef.current = engaged;
    setPinned(engaged);
  }, []);

  const closePopover = useCallback(() => handle.close(), [handle]);

  const handleOpenChange = useCallback(
    (open: boolean, details: Popover.Root.ChangeEventDetails) => {
      const reason = details.reason;

      if (
        pinnedRef.current &&
        (reason === "trigger-hover" || reason === "focus-out")
      ) {
        details.cancel();
        return;
      }

      if (open) {
        return;
      }

      if (
        pinnedRef.current &&
        (reason === "escape-key" ||
          reason === "outside-press" ||
          reason === "trigger-press")
      ) {
        details.cancel();
        requestGuarded(() => queueMicrotask(() => handle.close()));
        return;
      }

      pinnedRef.current = false;
      setPinned(false);
    },
    [handle, requestGuarded],
  );

  return (
    <div
      className={cn(
        "flex justify-between items-center px-1 py-2 w-full border-b transition-colors border-outline-gray-1",
        className,
      )}
    >
      <div className="flex items-center flex-1 min-w-0 group">
        <div className="flex items-center min-w-0 gap-2">
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
              icon={() =>
                starred ? (
                  <SolidStar className="text-ink-amber-2" size={16} />
                ) : (
                  <Star className="text-ink-gray-4" size={16} />
                )
              }
            />
          ) : null}
        </div>
      </div>
      {timeEntries.map((timeEntry, index) => {
        return (
          <div
            key={index}
            className="shrink-0 flex justify-end items-center text-base text-ink-gray-6 whitespace-nowrap w-16 h-7 pl-2 py-1.5"
          >
            <Popover.Trigger
              handle={handle}
              payload={{ dayIndex: index }}
              openOnHover={!(timeEntry.disabled && timeEntry.time === "")}
              delay={250}
              closeDelay={220}
              render={(props, state) => (
                <Button
                  {...props}
                  variant="ghost"
                  className={cn(
                    "w-14.25 relative group flex justify-center items-center text-ink-gray-6 lining-nums tabular-nums [&_span]:overflow-visible [&_span]:whitespace-normal",
                    "enabled:hover:bg-surface-gray-2 enabled:focus:bg-surface-gray-2 enabled:active:bg-surface-gray-3",
                    "aria-disabled:cursor-default! aria-disabled:text-ink-gray-5 aria-disabled:hover:bg-transparent aria-disabled:focus:bg-transparent aria-disabled:active:bg-transparent",
                  )}
                  aria-disabled={timeEntry.disabled}
                  onClick={(event) => {
                    if (!state.open) {
                      props.onClick?.(event);
                    }
                    if (!timeEntry.disabled) {
                      onCellClick?.(taskKey, index);
                    }
                  }}
                >
                  {timeEntry.time === "" ? (
                    <>
                      <span
                        className={cn("flex-1 text-center text-ink-gray-4", {
                          "group-hover:hidden group-disabled:group-hover:flex":
                            !timeEntry.disabled,
                        })}
                      >
                        -
                      </span>
                      <span
                        className={cn(
                          "hidden absolute top-0 left-0 justify-center items-center w-full h-full",
                          {
                            "group-hover:flex group-disabled:group-hover:hidden":
                              !timeEntry.disabled,
                          },
                        )}
                      >
                        <AddMd size={16} className="" />
                      </span>
                    </>
                  ) : (
                    <span>{timeEntry.time}</span>
                  )}
                  {timeEntry.nonBillable ? (
                    <span className="block absolute z-10 -bottom-0.5 left-1/2 w-1 h-1 rounded-full bg-surface-amber-3 transform -translate-x-1/2"></span>
                  ) : null}
                </Button>
              )}
            />
          </div>
        );
      })}

      <div className="shrink-0 flex justify-end items-center text-base text-end text-ink-gray-6 whitespace-nowrap w-16 h-7 px-2 py-1.5 lining-nums tabular-nums">
        <span>{totalHours}</span>
      </div>

      <div className="w-12 h-7 shrink-0"></div>

      <Popover.Root handle={handle} onOpenChange={handleOpenChange}>
        {({ payload }) => (
          <Popover.Portal>
            {pinned ? (
              <Popover.Backdrop className="fixed inset-0 pointer-events-auto!" />
            ) : null}
            <Popover.Positioner sideOffset={8} align="end">
              <Popover.Popup>
                {payload
                  ? renderInlineTimeEntryPopover?.(
                      taskKey,
                      payload.dayIndex,
                      closePopover,
                      reportEngaged,
                    )
                  : null}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        )}
      </Popover.Root>
    </div>
  );
};
