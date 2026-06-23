/**
 * External dependencies.
 */
import type { ReactNode } from "react";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";

export function EditableField({
  icon,
  label,
  value,
  isEditing = false,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  isEditing?: boolean;
  children?: ReactNode;
}) {
  const showEditor = isEditing && children;
  return (
    <div className="flex w-[180px] items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-gray-7">
        {icon}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-sm text-ink-gray-6">{label}</span>
        <span
          className={mergeClassNames(
            "truncate text-base font-medium text-ink-gray-7",
            showEditor && "hidden",
          )}
        >
          {value}
        </span>
        {showEditor ? children : null}
      </div>
    </div>
  );
}
