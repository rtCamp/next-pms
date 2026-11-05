/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useRisks } from "../context";
import { RiskRowActions } from "../riskRowActions";
import type { RiskItem, RiskListColumn } from "../types";
import { RiskCell } from "./cells";

export interface RiskGroupProps {
  value: string;
  label: string;
  columns: RiskListColumn[];
  risks: RiskItem[];
}

const rowMinWidth = (columns: RiskListColumn[]) =>
  columns.reduce((total, col) => total + parseInt(col.width, 10), 0) +
  32 +
  columns.length * 8;

export function RiskGroup({ value, label, columns, risks }: RiskGroupProps) {
  const minWidth = rowMinWidth(columns);
  const openRiskDetail = useRisks((c) => c.actions.openRiskDetail);

  return (
    <Accordion.Item value={value}>
      {/* Group header */}
      <Accordion.Header className="w-full">
        <Accordion.Trigger className="flex items-center gap-2 w-full px-2 py-3 mb-2 text-base font-semibold text-ink-gray-8 border-b border-outline-gray-1 group rounded-sm focus-visible:outline-offset-[-2px]">
          <SmallDown
            aria-hidden
            className="size-4 shrink-0 text-ink-gray-5 transition-transform -rotate-90 group-data-panel-open:rotate-0"
          />
          <span>{label}</span>
          <span className="text-xs text-ink-gray-6 rounded-full bg-surface-gray-2 px-1.5 py-0.5">
            {risks.length}
          </span>
        </Accordion.Trigger>
      </Accordion.Header>

      {/* Rows */}
      <Accordion.Panel className="accordion-panel">
        <div className="overflow-x-auto">
          {/* Column header */}
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
            {/* spacer for actions column */}
            <div className="w-8 shrink-0" />
          </div>

          {risks.length === 0 && (
            <div className="py-6 text-center text-sm text-ink-gray-5">
              No risks found
            </div>
          )}

          {risks.map((risk) => (
            <div
              key={risk.name}
              style={{ minWidth }}
              className="flex items-center gap-2 px-2 py-1.5 border-b border-outline-gray-1 hover:bg-surface-gray-1 text-base text-ink-gray-6 cursor-pointer last:mb-5"
              onClick={() => openRiskDetail(risk.name)}
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  style={{ minWidth: col.width, flex: col.flex }}
                  className="flex min-w-0 px-2 py-1.5"
                >
                  <RiskCell column={col} risk={risk} />
                </div>
              ))}

              {/* Row actions */}
              <div
                className="w-8 shrink-0 flex justify-end"
                onClick={(e) => e.stopPropagation()}
              >
                <RiskRowActions
                  riskName={risk.name}
                  riskOwner={risk.risk_owner}
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
