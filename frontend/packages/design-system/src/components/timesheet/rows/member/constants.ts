/**
 * External dependencies.
 */
import React from "react";
import type { BadgeProps, ButtonVariant } from "@rtcamp/frappe-ui-react";
import { cva } from "class-variance-authority";
import { Check, CircleCheck, CircleX } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { ApprovalStatusType } from "../constants";

export const statusTheme: Record<ApprovalStatusType, BadgeProps["theme"]> = {
  "not-submitted": "gray",
  approved: "green",
  rejected: "red",
  "approval-pending": "orange",
  none: "gray",
};

export const statusIcon: Record<
  ApprovalStatusType,
  {
    variant: ButtonVariant;
    icon: React.ComponentType<{ size?: number }> | null;
  }
> = {
  "not-submitted": {
    variant: "ghost",
    icon: null,
  },
  approved: {
    variant: "ghost",
    icon: CircleCheck,
  },
  rejected: {
    variant: "ghost",
    icon: CircleX,
  },
  "approval-pending": {
    variant: "solid",
    icon: Check,
  },
  none: {
    variant: "ghost",
    icon: null,
  },
};

export const buttonVariants = cva("", {
  variants: {
    status: {
      "not-submitted": "",
      approved: "text-ink-green-4",
      rejected: "text-ink-red-4",
      "approval-pending": "text-ink-white",
      none: "",
    },
    variant: {
      solid: "",
      subtle: "",
      outline: "",
      ghost:
        "border-none outline-none focus:ring-0 focus-visible:ring-0 bg-transparent hover:bg-transparent active:bg-transparent",
    },
  },
  defaultVariants: {
    variant: "solid",
  },
});
