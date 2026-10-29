/**
 * External dependencies.
 */
import type { ComponentProps } from "react";
import { SolidDotLg } from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";
import { RagStatus } from "../types";

const dotVariants = cva("size-4 shrink-0", {
  variants: {
    risk: {
      red: "text-ink-red-3",
      amber: "text-ink-amber-3",
      green: "text-ink-green-3",
    } satisfies Record<RagStatus, string>,
  },
});

export type DotProps = VariantProps<typeof dotVariants>;

export function Dot({ risk, ...props }: DotProps & ComponentProps<"svg">) {
  return <SolidDotLg {...props} className={dotVariants({ risk })} />;
}
