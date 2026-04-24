/**
 * External dependencies.
 */
import { SolidDotLg } from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";

const dotVariants = cva("size-4 shrink-0", {
  variants: {
    risk: {
      "at-risk": "text-ink-red-3",
      caution: "text-ink-amber-3",
      "on-track": "text-ink-green-3",
    },
  },
});

type DotProps = VariantProps<typeof dotVariants>;

export function Dot({ risk }: DotProps) {
  return <SolidDotLg className={dotVariants({ risk })} />;
}
