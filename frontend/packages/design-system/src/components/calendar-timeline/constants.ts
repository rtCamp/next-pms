/**
 * External dependencies.
 */
import { cva } from "class-variance-authority";

export const DEFAULT_VISIBLE_DAYS = 14;

export const WEEKEND_DAY_INDICES = [0, 6];

export const eventChipVariants = cva(
  "flex w-full flex-col gap-0.5 rounded-md py-0.5 pl-1 pr-2 text-left",
  {
    variants: {
      color: {
        violet: "bg-violet-100",
        blue: "bg-blue-100",
      },
    },
    defaultVariants: { color: "blue" },
  },
);

export const eventChipTitleVariants = cva(
  "w-full truncate text-xs leading-[1.15]",
  {
    variants: {
      color: {
        violet: "text-violet-700",
        blue: "text-blue-700",
      },
    },
    defaultVariants: { color: "blue" },
  },
);

export const eventChipSubtitleVariants = cva(
  "w-full truncate text-2xs leading-[1.15]",
  {
    variants: {
      color: {
        violet: "text-violet-400",
        blue: "text-blue-400",
      },
    },
    defaultVariants: { color: "blue" },
  },
);
