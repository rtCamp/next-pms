/**
 * External dependencies.
 */
import { useSortable } from "@dnd-kit/react/sortable";
import { mergeClassNames as cn } from "@next-pms/design-system";
import type { SortState } from "@next-pms/design-system/components";
import { Dropdown, Tooltip } from "@rtcamp/frappe-ui-react";
import {
  ArrowDown,
  ArrowUp,
  Pin,
  SmallDown,
  Unpin,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { MAX_PINNED_COLUMNS } from "./constants";
import { getSortableInput } from "./utils";
import type { ProjectListColumn } from "../../types";

type ColumnHeaderProps = {
  column: ProjectListColumn;
  index: number;
  pinnedCount: number;
  sort: SortState;
  isSortDisabled: boolean;
  onSort: (sortField: string) => void;
  onTogglePinned: (key: string) => void;
};

export function ColumnHeader({
  column,
  index,
  pinnedCount,
  sort,
  isSortDisabled,
  onSort,
  onTogglePinned,
}: ColumnHeaderProps) {
  const isPinned = index < pinnedCount;
  const isPinLimit = !isPinned && pinnedCount >= MAX_PINNED_COLUMNS;
  const isSorted = sort.field === column.sortField;
  const { ref, isDragging } = useSortable(
    getSortableInput(column.key, index, pinnedCount),
  );

  const label = (
    <>
      <span className="truncate">{column.label}</span>
      {isSorted &&
        (sort.order === "asc" ? (
          <ArrowUp className="size-3.5 shrink-0 text-ink-gray-7" />
        ) : (
          <ArrowDown className="size-3.5 shrink-0 text-ink-gray-7" />
        ))}
    </>
  );

  const headerControl = column.sortField ? (
    <button
      type="button"
      aria-disabled={isSortDisabled}
      className={cn(
        "flex h-7 min-w-0 items-center gap-1 rounded-sm py-1.5 select-none",
        isSortDisabled && "cursor-not-allowed text-ink-gray-5",
      )}
      onClick={() => onSort(column.sortField!)}
    >
      {label}
    </button>
  ) : (
    <div className="flex h-7 items-center gap-1 py-1.5">{label}</div>
  );

  return (
    <div
      ref={ref}
      role="columnheader"
      aria-sort={
        column.sortField
          ? isSorted
            ? sort.order === "asc"
              ? "ascending"
              : "descending"
            : "none"
          : undefined
      }
      className={cn(
        "flex min-w-0 items-center gap-1 text-sm text-ink-gray-5",
        isDragging && "opacity-50",
      )}
    >
      {isSortDisabled ? (
        <Tooltip text="Select a currency to enable this sort">
          {headerControl}
        </Tooltip>
      ) : (
        headerControl
      )}
      <Dropdown
        side="bottom"
        renderMenuItem={(menuProps) =>
          isPinLimit ? (
            <Tooltip text={`You can pin up to ${MAX_PINNED_COLUMNS} columns`}>
              <div
                {...menuProps}
                className={cn(
                  menuProps.className,
                  "cursor-not-allowed opacity-50",
                )}
              />
            </Tooltip>
          ) : (
            <div {...menuProps} />
          )
        }
        options={[
          {
            group: "",
            key: "pin",
            items: [
              {
                label: isPinned ? "Unpin column" : "Pin column",
                icon: isPinned ? (
                  <Unpin className="size-4 mr-2" />
                ) : (
                  <Pin className="size-4 mr-2" />
                ),
                onClick: () => onTogglePinned(column.key),
              },
            ],
          },
        ]}
      >
        <button
          type="button"
          aria-label={`${column.label} column options`}
          className="shrink-0 rounded-sm p-0.5"
        >
          <SmallDown className="size-3.5 text-ink-gray-6" />
        </button>
      </Dropdown>
    </div>
  );
}
