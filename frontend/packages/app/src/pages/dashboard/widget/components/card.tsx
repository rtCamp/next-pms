import type { PropsWithChildren } from "react";
import { mergeClassNames } from "@next-pms/design-system";

export default function WidgetCard({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={mergeClassNames(
        "flex flex-col gap-2 rounded-lg border border-outline-gray-1 bg-surface-cards p-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
