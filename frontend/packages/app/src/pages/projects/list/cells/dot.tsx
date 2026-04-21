/**
 * External dependencies.
 */
import { cva, type VariantProps } from "class-variance-authority";

const dotVariants = cva("size-2 shrink-0", {
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
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 8"
      fill="currentColor"
      className={dotVariants({ risk })}
    >
      <circle cx="4" cy="4" r="4" />
    </svg>
  );
}
