/**
 * External dependencies.
 */
import type { ReactNode } from "react";

export function OverviewField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex w-[180px] items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-gray-7">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-[13px] font-light text-ink-gray-6">{label}</span>
        <span className="truncate text-sm font-medium text-ink-gray-7">
          {value}
        </span>
      </div>
    </div>
  );
}
