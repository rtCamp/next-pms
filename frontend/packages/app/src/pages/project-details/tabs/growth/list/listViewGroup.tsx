/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { GrowthRowActions } from "../rowActions";
import type { GrowthInitiativeItem, GrowthListColumn } from "../types";
import { GrowthCell } from "./cells";

interface GrowthGroupProps {
  value: string;
  label: string;
  columns: GrowthListColumn[];
  items: GrowthInitiativeItem[];
}

const rowMinWidth = (columns: GrowthListColumn[]) =>
  columns.reduce((total, col) => total + parseInt(col.width, 10), 0) +
  16 +
  columns.length * 8 +
  32;

export function GrowthGroup({
  value,
  label,
  columns,
  items,
}: GrowthGroupProps) {
  const minWidth = rowMinWidth(columns);

  return (
    <Accordion.Item value={value}>
      <Accordion.Header className="w-full">
        <Accordion.Trigger className="flex items-center gap-2 w-full px-2 py-3 mb-2 text-base font-semibold text-ink-gray-8 border-b border-outline-gray-1 group rounded-sm focus-visible:outline-offset-[-2px]">
          <SmallDown
            aria-hidden
            className="size-4 shrink-0 text-ink-gray-5 transition-transform -rotate-90 group-data-panel-open:rotate-0"
          />
          <span>{label}</span>
          <span className="text-xs text-ink-gray-6 rounded-full bg-surface-gray-2 px-1.5 py-0.5">
            {items.length}
          </span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Panel className="accordion-panel">
        <div className="overflow-x-auto">
          <div
            style={{ minWidth }}
            className="flex items-center gap-2 px-1 py-0.5 border-b border-outline-gray-1 text-sm text-ink-gray-5 mb-2"
          >
            {columns.map((col) => (
              <div
                key={col.key}
                style={{ minWidth: col.width, flex: col.flex }}
                className="truncate px-2 py-1.5"
              >
                {col.label}
              </div>
            ))}
            <div className="w-8 shrink-0" />
          </div>

          {items.length === 0 && (
            <div className="sticky left-0 py-6 text-center text-sm text-ink-gray-5">
              No growth initiatives found
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.name}
              style={{ minWidth }}
              className="flex items-center gap-2 px-1 py-1.5 border-b border-outline-gray-1 hover:bg-surface-gray-1 text-base text-ink-gray-6 last:mb-5"
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  style={{ minWidth: col.width, flex: col.flex }}
                  className="flex min-w-0 px-2 py-1.5"
                >
                  <GrowthCell column={col} item={item} />
                </div>
              ))}
              <div className="w-8 shrink-0 flex justify-end">
                <GrowthRowActions
                  growthName={item.name}
                  activityOwner={item.activity_owner}
                  showFollow={false}
                />
              </div>
            </div>
          ))}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
