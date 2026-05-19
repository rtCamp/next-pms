/**
 * External dependencies.
 */
import type { ReactNode } from "react";

export function OverviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-medium text-ink-gray-8">{title}</h2>
      {children}
    </section>
  );
}
