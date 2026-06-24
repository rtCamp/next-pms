/**
 * External dependencies.
 */
import type { ReactNode } from "react";
import { mergeClassNames as cn } from "@/lib/utils";

export function OverviewSection({
  title,
  actions,
  children,
  className,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-ink-gray-8">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
