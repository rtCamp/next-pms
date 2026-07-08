/**
 * External dependencies.
 */
import type { PropsWithChildren } from "react";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";

export function Field({
  label,
  className,
  children,
}: PropsWithChildren<{ label: string; className?: string }>) {
  return (
    <div className={mergeClassNames("flex flex-col gap-1.5", className)}>
      <label className="block text-base text-ink-gray-5">{label}</label>
      {children}
    </div>
  );
}
