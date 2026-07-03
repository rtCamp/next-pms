import { Link } from "react-router-dom";
import { mergeClassNames } from "@next-pms/design-system";

export type StatCardData = {
  label: string;
  value: string | number;
  subLabel?: string;
  className?: string;
  to?: string;
};

const CARD_BASE =
  "flex flex-col gap-2 rounded-lg border border-outline-gray-1 bg-surface-cards p-3";

export function StatCard({
  label,
  value,
  subLabel,
  className,
  to,
}: StatCardData) {
  const content = (
    <>
      <span className="truncate text-base text-ink-gray-5">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-medium text-ink-gray-8">{value}</span>
        {subLabel && (
          <span className="truncate text-base text-ink-gray-5">{subLabel}</span>
        )}
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={mergeClassNames(
          CARD_BASE,
          "hover:bg-surface-gray-1 transition-colors",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={mergeClassNames(CARD_BASE, className)}>{content}</div>;
}
