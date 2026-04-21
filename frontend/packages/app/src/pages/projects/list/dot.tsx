/**
 * External dependencies.
 */
import { type VariantProps } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import { riskDotVariants } from "./constants";

type DotProps = VariantProps<typeof riskDotVariants>;

export function Dot({ risk }: DotProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 8"
      fill="currentColor"
      className={riskDotVariants({ risk })}
    >
      <circle cx="4" cy="4" r="4" />
    </svg>
  );
}
