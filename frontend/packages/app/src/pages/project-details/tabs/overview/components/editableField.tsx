/**
 * External dependencies.
 */
import type { ReactNode } from "react";

/**
 * Internal dependencies.
 */
import { OverviewField } from "./overviewField";

export function EditableField({
  icon,
  label,
  value,
  isEditing,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isEditing: boolean;
  children: ReactNode;
}) {
  if (!isEditing) {
    return <OverviewField icon={icon} label={label} value={value} />;
  }
  return (
    <div className="flex w-[180px] items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-gray-7">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-[13px] font-light text-ink-gray-6">{label}</span>
        {children}
      </div>
    </div>
  );
}
