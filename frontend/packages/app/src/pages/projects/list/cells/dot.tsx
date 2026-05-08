/**
 * External dependencies.
 */
import { SolidDotLg } from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";

const dotVariants = cva("size-4 shrink-0", {
  variants: {
    risk: {
      Red: "text-ink-red-3",
      Amber: "text-ink-amber-3",
      Green: "text-ink-green-3",
    },
  },
});

export type DotProps = VariantProps<typeof dotVariants>;
export type RiskLevel = NonNullable<DotProps["risk"]>;

export function Dot({ risk }: DotProps) {
  return <SolidDotLg className={dotVariants({ risk })} />;
}
