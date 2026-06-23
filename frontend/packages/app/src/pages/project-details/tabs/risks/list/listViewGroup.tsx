/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";
import { stripTags } from "@next-pms/design-system/utils";
import { Avatar } from "@rtcamp/frappe-ui-react";
import { SmallDown } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { RISK_LIST_COLUMNS } from "../constants";
import { useRisks } from "../context";
import { RiskRowActions } from "../riskRowActions";
import { RiskStatusBadge } from "../riskStatusBadge";
import type { RiskItem } from "../types";

export interface RiskGroupProps {
  value: string;
  label: string;
  risks: RiskItem[];
}

export function RiskGroup({ value, label, risks }: RiskGroupProps) {
  const openRiskDetail = useRisks((c) => c.actions.openRiskDetail);

  return (
    <Accordion.Item value={value}>
      {/* Group header */}
      <Accordion.Header className="w-full">
        <Accordion.Trigger className="flex items-center gap-2 w-full px-2 py-3 mb-2 text-base font-semibold text-ink-gray-8 border-b border-outline-gray-1 group">
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
        {/* Column header */}
        <div className="flex items-center gap-2 px-1 py-0.5 border-b border-outline-gray-1 text-sm text-ink-gray-5 mb-2">
          {RISK_LIST_COLUMNS.map((col) => (
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
            className="flex items-center gap-2 px-2 py-1 border-b border-outline-gray-1 hover:bg-surface-gray-1 text-base cursor-pointer"
            onClick={() => openRiskDetail(risk.name)}
          >
            {/* Risk category */}
            <div
              style={{
                minWidth: RISK_LIST_COLUMNS[0].width,
                flex: RISK_LIST_COLUMNS[0].flex,
              }}
              className="truncate font-medium text-ink-gray-8 px-2 py-1.5"
            >
              {risk.risk_category ?? "—"}
            </div>

            {/* Summary */}
            <div
              style={{
                minWidth: RISK_LIST_COLUMNS[1].width,
                flex: RISK_LIST_COLUMNS[1].flex,
              }}
              className="truncate text-ink-gray-7 px-2 py-1.5"
            >
              {stripTags(risk.summary || "—")}
            </div>

            {/* Owner */}
            <div
              style={{
                minWidth: RISK_LIST_COLUMNS[2].width,
                flex: RISK_LIST_COLUMNS[2].flex,
              }}
              className="truncate text-ink-gray-7 px-2 py-1.5"
            >
              <div className="flex items-center gap-2">
                <Avatar
                  size="xs"
                  shape="circle"
                  image={risk.owner_details?.user_image ?? undefined}
                  label={risk.owner_details?.full_name ?? risk.owner}
                />
                <span className="truncate">
                  {risk.owner_details?.full_name ?? risk.owner}
                </span>
              </div>
            </div>

            {/* Risk level */}
            <div
              style={{
                minWidth: RISK_LIST_COLUMNS[3].width,
                flex: RISK_LIST_COLUMNS[3].flex,
              }}
              className="truncate text-ink-gray-7 px-2 py-1.5"
            >
              {risk.risk_level ?? "—"}
            </div>

            {/* Status */}
            <div
              style={{
                minWidth: RISK_LIST_COLUMNS[4].width,
                flex: RISK_LIST_COLUMNS[4].flex,
              }}
              className="px-2 py-1.5"
            >
              <RiskStatusBadge status={risk.status} />
            </div>

            {/* Row actions */}
            <div
              className="w-8 shrink-0 flex justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <RiskRowActions riskName={risk.name} showFollow={false} />
            </div>
          </div>
        ))}
      </Accordion.Panel>
    </Accordion.Item>
  );
}
