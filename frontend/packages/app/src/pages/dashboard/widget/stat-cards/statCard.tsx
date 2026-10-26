import { Link } from "react-router";
import { mergeClassNames } from "@next-pms/design-system";
import { InfoHoverCard } from "@next-pms/design-system/components";
import type { FieldHelp } from "@next-pms/design-system/components";
import { formatNumber } from "@/lib/utils";

export type StatCardData = {
  label: string;
  value: string | number;
  subLabel?: string;
  className?: string;
  to?: string;
  help?: FieldHelp;
};

const CARD_BASE =
  "flex flex-col gap-2 rounded-lg border border-outline-gray-1 bg-surface-cards p-3";

export function StatCard({
  label,
  value,
  subLabel,
  className,
  to,
  help,
}: StatCardData) {
  const content = (
    <>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-base text-ink-gray-5">{label}</span>
        {help && <InfoHoverCard help={help} className="relative z-10" />}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-medium text-ink-gray-8">
          {formatNumber(value)}
        </span>
        {subLabel && (
          <span className="truncate text-base text-ink-gray-5">{subLabel}</span>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <div
        className={mergeClassNames(
          CARD_BASE,
          "relative hover:bg-surface-gray-1 transition-colors",
          className,
        )}
      >
        <Link
          to={to}
          aria-label={label}
          className="absolute inset-0 rounded-lg"
        />
        {content}
      </div>
    );
  }

  return <div className={mergeClassNames(CARD_BASE, className)}>{content}</div>;
}
