/**
 * External dependencies.
 */
import { type VariantProps } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import { phaseIconVariants } from "./constants";

type StagesIconProps = VariantProps<typeof phaseIconVariants>;

// @todo Use the Stages icon from frappe-ui-react when
// https://github.com/rtCamp/frappe-ui-react/pull/248 is merged.
export function StagesIcon({ phase }: StagesIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={phaseIconVariants({ phase })}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
      />
    </svg>
  );
}
