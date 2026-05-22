/**
 * External dependencies.
 */
import type { ReactNode } from "react";

export function OverviewSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-ink-gray-8">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
