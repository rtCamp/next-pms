/**
 * External dependencies.
 */
import type { ReactNode } from "react";

export function OverviewSection({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-ink-gray-8">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
