/**
 * External dependencies.
 */
import { cva } from "class-variance-authority";

export const buttonVariants = cva("", {
  variants: {
    status: {
      "not-submitted": "text-ink-white",
      approved: "text-ink-green-4",
      rejected: "text-ink-red-4",
      "approval-pending": "text-ink-amber-4",
      "partially-approved": "text-ink-green-4",
      "partially-rejected": "text-ink-red-4",
      none: "",
    },
    thisWeek: { true: "", false: "" },
    collapsed: { true: "", false: "" },
    variant: {
      solid: "",
      subtle: "",
      outline: "",
      ghost:
        "border-none outline-none focus:ring-0 focus-visible:ring-0 bg-transparent hover:bg-transparent active:bg-transparent",
    },
  },
  compoundVariants: [
    {
      status: "rejected",
      thisWeek: false,
      collapsed: false,
      class: "text-ink-gray-5",
    },
  ],
  defaultVariants: {
    thisWeek: true,
    collapsed: false,
    variant: "solid",
  },
});
