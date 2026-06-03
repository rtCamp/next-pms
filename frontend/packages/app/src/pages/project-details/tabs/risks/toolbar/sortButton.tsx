/**
 * External dependencies.
 */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Popover } from "@base-ui/react";
import { ArrowDown, ArrowUp } from "@rtcamp/frappe-ui-react/icons";
import { ArrowUpDown } from "lucide-react";

/**
 * Internal dependencies.
 */
import { RISK_VIEW_PARAM } from "../constants";
import { useRisks } from "../context";

const SORT_FIELDS: { field: string; label: string }[] = [
  { field: "modified", label: "Last updated on" },
  { field: "status", label: "Status" },
  { field: "risk_category", label: "Risk category" },
  { field: "risk_level", label: "Risk level" },
];

export function SortButton() {
  const [open, setOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const isKanban = searchParams.get(RISK_VIEW_PARAM) === "kanban";
  const sort = useRisks((c) => c.state.sort);
  const setSort = useRisks((c) => c.actions.setSort);

  const sortFields = isKanban
    ? SORT_FIELDS.filter((f) => f.field !== "status")
    : SORT_FIELDS;

  const handleFieldClick = (field: string) => {
    if (sort?.field === field) {
      setSort({ field, order: sort.order === "asc" ? "desc" : "asc" });
    } else {
      setSort({ field, order: "desc" });
    }
  };

  const isActive = sort !== null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={
          "flex items-center gap-1.5 rounded px-2 py-1.5 text-sm border cursor-pointer border-none bg-surface-gray-2"
        }
      >
        <ArrowUpDown className="size-3.5" />
        Sort
        {isActive && (
          <span className="text-xs text-ink-gray-5">
            {sortFields.find((f) => f.field === sort.field)?.label}
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4}>
          <Popover.Popup className="min-w-44 rounded-lg border border-outline-gray-2 bg-surface-white shadow-lg py-1 z-50">
            {sortFields.map(({ field, label }) => {
              const isSelected = sort?.field === field;
              return (
                <button
                  key={field}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-sm text-ink-gray-8 hover:bg-surface-gray-2"
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
            {isActive && (
              <>
                <div className="my-1 border-t border-outline-gray-2" />
                <button
                  type="button"
                  className="flex w-full items-center px-3 py-1.5 text-sm text-ink-red-3 hover:bg-surface-gray-2"
                  onClick={() => {
                    setSort(null);
                    setOpen(false);
                  }}
                >
                  Clear sort
                </button>
              </>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
