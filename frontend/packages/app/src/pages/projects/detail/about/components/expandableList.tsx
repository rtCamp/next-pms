/**
 * External dependencies.
 */
import { useState, type ReactNode } from "react";
import { mergeClassNames } from "@next-pms/design-system";

type ExpandableListProps<T> = {
  items: T[];
  visibleCount?: number;
  itemLabel: string;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
};

export function ExpandableList<T>({
  items,
  visibleCount = 3,
  itemLabel,
  getKey,
  renderItem,
}: ExpandableListProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const remaining = Math.max(0, items.length - visibleCount);
  const shown = expanded ? items : items.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-1">
      <div
        className={mergeClassNames("flex flex-col", {
          "max-h-32 overflow-y-auto scroll pr-1": expanded,
        })}
      >
        {shown.map((item) => (
          <div key={getKey(item)}>{renderItem(item)}</div>
        ))}
      </div>
      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="py-1.5 text-left text-base font-light text-ink-gray-5 hover:text-ink-gray-7"
        >
          {expanded ? "Show less" : `+${remaining} more ${itemLabel}`}
        </button>
      ) : null}
    </div>
  );
}
