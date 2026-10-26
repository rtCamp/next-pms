/**
 * External dependencies.
 */
import { Fragment, useState } from "react";
import { InfoHoverCard } from "@next-pms/design-system/components";
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
import { TRACKING_HELP } from "../help";

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
  const projectValue =
    mode === "projected"
      ? tracking.total_project_value
      : tracking.current_project_value;
  const profit =
    mode === "projected" ? tracking.project_profit : tracking.current_profit;
  const margin =
    mode === "projected"
      ? tracking.projected_profit_margin
      : tracking.current_profit_margin;

  const rows = [
    ...(showProjectValue
      ? [
          {
            key: "project-value",
            label: "Total project value",
            value: projectValue === null ? "N/A" : format.format(projectValue),
            help:
              mode === "projected"
                ? TRACKING_HELP.totalProjectValue
                : TRACKING_HELP.currentProjectValue,
          },
        ]
      : []),
    {
      key: "profit",
      label: mode === "projected" ? "Projected profit" : "Current profit",
      value: profit === null ? "N/A" : format.format(profit),
      help:
        mode === "projected"
          ? TRACKING_HELP.projectedProfit
          : TRACKING_HELP.currentProfit,
    },
    {
      key: "margin",
      label:
        mode === "projected"
          ? "Projected profit margin"
          : "Current profit margin",
      value: margin === null ? "N/A" : formatPercentage(margin),
      help:
        mode === "projected"
          ? TRACKING_HELP.projectedMargin
          : TRACKING_HELP.currentMargin,
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
          "flex flex-1 flex-col px-3",
          layout === "row" &&
            "lg:flex-row lg:items-center lg:py-3 lg:pl-0 lg:pr-10",
        )}
      >
        {rows.map((row, index) => (
          <Fragment key={row.key}>
            {index > 0 && (
              <div
                className={cn(
                  "flex w-full shrink-0 justify-center",
                  layout === "row" && "lg:w-auto lg:flex-1 lg:self-stretch",
                )}
              >
                <div
                  className={cn(
                    "h-px w-full bg-outline-gray-1",
                    layout === "row" && "lg:h-auto lg:w-px",
                  )}
                />
              </div>
            )}
            <div
              className={cn(
                "flex min-w-0 flex-1 flex-col justify-center gap-2 py-3",
                layout === "row" && "lg:flex-[0_1_auto] lg:px-3 lg:py-0",
              )}
            >
              <div className="flex min-w-0 items-center gap-1.5 pr-6">
                <span className="truncate text-base font-normal text-ink-gray-5">
                  {row.label}
                </span>
                <InfoHoverCard help={row.help} />
              </div>
              <Tooltip text={row.value} showWhen="truncated">
                <span className="truncate text-xl font-medium text-ink-gray-8">
                  {row.value}
                </span>
              </Tooltip>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
