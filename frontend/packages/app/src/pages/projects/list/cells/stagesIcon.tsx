/**
 * External dependencies.
 */
import { cva, type VariantProps } from "class-variance-authority";

const stagesIconVariants = cva("size-4 shrink-0", {
  variants: {
    phase: {
      "delivery-prep": "text-ink-gray-4",
      "kick-off": "text-ink-blue-3",
      discovery: "text-ink-amber-3",
      development: "text-ink-cyan-3",
      launch: "text-ink-green-3",
      "close-out": "text-ink-violet-3",
    },
  },
});

type StagesIconProps = VariantProps<typeof stagesIconVariants>;

// @todo Use the Stages icon from frappe-ui-react when
// https://github.com/rtCamp/frappe-ui-react/pull/248 is merged.
export function StagesIcon({ phase }: StagesIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={stagesIconVariants({ phase })}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
      />
    </svg>
  );
}
