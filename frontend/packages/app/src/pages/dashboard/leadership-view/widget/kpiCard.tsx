/**
 * External dependencies.
 */
import {
  ArrowDownLeft,
  ArrowUpRight,
  SmallDown,
} from "@rtcamp/frappe-ui-react/icons";
import { cva } from "class-variance-authority";

const trendVariants = cva("flex items-center gap-0.5", {
  variants: {
    tone: {
      positive: "text-ink-green-4",
      negative: "text-ink-red-4",
    },
  },
});

export type KpiCardData = {
  label: string;
  value: string;
  trend: {
    value: string;
    direction: "up" | "down";
    tone: "positive" | "negative";
  };
  comparison: string;
};

export function KpiCard({ label, value, trend, comparison }: KpiCardData) {
  const TrendArrow = trend.direction === "up" ? ArrowUpRight : ArrowDownLeft;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-outline-gray-1 bg-surface-cards p-3">
      <span className="truncate text-base text-ink-gray-5">{label}</span>
      <span className="truncate text-2xl font-medium text-ink-gray-8">
        {value}
      </span>
      <div className="flex items-center gap-1 text-sm">
        <span className={trendVariants({ tone: trend.tone })}>
          <TrendArrow className="size-4 shrink-0" />
          {trend.value}
        </span>
        <span className="flex min-w-0 items-center text-ink-gray-5">
          <span className="truncate">{comparison}</span>
          <SmallDown className="size-4 shrink-0" />
        </span>
      </div>
    </div>
  );
}
