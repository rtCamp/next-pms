/**
 * External dependencies.
 */
import { useState } from "react";
import { Dropdown, Tooltip } from "@rtcamp/frappe-ui-react";
import { Check, DotHorizontal } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import {
  currencyFormat,
  formatPercentage,
  mergeClassNames as cn,
} from "@/lib/utils";
import { useProjectDetail } from "@/pages/project-details/context";
import { useTracking } from "../context";

type FinancialsBlockProps = {
  showProjectValue: boolean;
  layout?: "stacked" | "row";
};

export function FinancialsBlock({
  showProjectValue,
  layout = "stacked",
}: FinancialsBlockProps) {
  const currency = useProjectDetail((s) => s.project?.custom_currency);
  const tracking = useTracking((state) => state.tracking);
  const [mode, setMode] = useState<"projected" | "current">("projected");

  const format = currencyFormat(currency);

  const rows = [
    ...(showProjectValue
      ? [
          {
            key: "project-value",
            label: "Total project value",
            value: format.format(
              (mode === "projected"
                ? tracking.total_project_value
                : tracking.current_project_value) ?? 0,
            ),
          },
        ]
      : []),
    {
      key: "profit",
      label: mode === "projected" ? "Projected profit" : "Current profit",
      value: format.format(
        (mode === "projected"
          ? tracking.project_profit
          : tracking.current_profit) ?? 0,
      ),
    },
    {
      key: "margin",
      label:
        mode === "projected"
          ? "Projected profit margin"
          : "Current profit margin",
      value: formatPercentage(
        (mode === "projected"
          ? tracking.projected_profit_margin
          : tracking.current_profit_margin) ?? 0,
      ),
    },
  ];

  return (
    <div className="relative flex flex-1 min-w-0 flex-col rounded-xl border border-outline-gray-1 bg-surface-cards">
      <div className="absolute right-3 top-3">
        <Dropdown
          placement="center"
          selectedKey={mode}
          button={{
            variant: "ghost",
            icon: DotHorizontal,
            "aria-label": "Switch financial figures",
          }}
          options={[
            {
              key: "current",
              label: "Current",
              icon:
                mode === "current" ? (
                  <Check className="order-last ml-auto size-4 shrink-0" />
                ) : undefined,
              onClick: () => setMode("current"),
            },
            {
              key: "projected",
              label: "Projected",
              icon:
                mode === "projected" ? (
                  <Check className="order-last ml-auto size-4 shrink-0" />
                ) : undefined,
              onClick: () => setMode("projected"),
            },
          ]}
        />
      </div>
      <div
        className={cn(
          "flex flex-1 divide-outline-gray-1",
          layout === "row" ? "divide-x py-3" : "flex-col divide-y px-3",
        )}
      >
        {rows.map((row) => (
          <div
            key={row.key}
            className={cn(
              "flex min-w-0 flex-1 flex-col justify-center gap-2",
              layout === "row" ? "px-3" : "py-3",
            )}
          >
            <span className="truncate pr-6 text-base font-normal text-ink-gray-5">
              {row.label}
            </span>
            <Tooltip text={row.value} showWhen="truncated">
              <span className="truncate text-xl font-medium text-ink-gray-8">
                {row.value}
              </span>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
}
