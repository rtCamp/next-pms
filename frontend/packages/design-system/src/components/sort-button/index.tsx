/**
 * External dependencies.
 */
import { useState } from "react";
import { Popover } from "@base-ui/react";
import { mergeClassNames as cn } from "@next-pms/design-system";
import { ArrowDown, ArrowUp, Sort } from "@rtcamp/frappe-ui-react/icons";

export type SortOrder = "asc" | "desc";

export interface SortField {
  field: string;
  label: string;
}

export interface SortState {
  field: string;
  order: SortOrder;
}

export interface SortButtonProps {
  className?: string;
  fields: SortField[];
  sort: SortState | null;
  onSortChange: (sort: SortState | null) => void;
}

export function SortButton({
  className,
  fields,
  sort,
  onSortChange,
}: SortButtonProps) {
  const [open, setOpen] = useState(false);

  const handleFieldClick = (field: string) => {
    if (sort?.field === field) {
      onSortChange({ field, order: sort.order === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ field, order: "desc" });
    }
  };

  const isActive = sort !== null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cn(
          "flex items-center gap-1.5 rounded px-2 py-1.5 text-sm border cursor-pointer border-none bg-surface-gray-2",
          className,
        )}
      >
        <Sort className="size-3.5" />
        Sort
        {isActive && (
          <span className="text-xs text-ink-gray-5">
            {fields.find((f) => f.field === sort.field)?.label}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4}>
          <Popover.Popup className="min-w-44 rounded-lg border border-outline-gray-2 bg-surface-white shadow-lg py-1 z-50">
            <div className="flex flex-col px-1">
              {fields.map(({ field, label }) => {
                const isSelected = sort?.field === field;
                return (
                  <button
                    key={field}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-3 py-1.5 rounded text-sm text-ink-gray-8 hover:bg-surface-gray-2"
                    onClick={() => handleFieldClick(field)}
                  >
                    <span>{label}</span>
                    {isSelected &&
                      (sort.order === "asc" ? (
                        <ArrowUp className="size-4" />
                      ) : (
                        <ArrowDown className="size-4" />
                      ))}
                  </button>
                );
              })}
            </div>
            {isActive && (
              <>
                <div className="my-1 border-t border-outline-gray-2" />
                <div className="px-1">
                  <button
                    type="button"
                    className="flex w-full items-center px-3 py-1.5 rounded text-sm text-ink-red-3 hover:bg-surface-gray-2"
                    onClick={() => {
                      onSortChange(null);
                      setOpen(false);
                    }}
                  >
                    Clear sort
                  </button>
                </div>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
