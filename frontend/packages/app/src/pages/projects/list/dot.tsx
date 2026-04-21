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
  return <span aria-hidden="true" className={riskDotVariants({ risk })} />;
}
