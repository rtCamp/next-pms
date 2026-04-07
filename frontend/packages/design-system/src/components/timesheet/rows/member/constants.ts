/**
 * External dependencies.
 */
import { ButtonVariant } from "@rtcamp/frappe-ui-react";
import { cva } from "class-variance-authority";
import { Check } from "lucide-react";
import { approvalStatusIcon, ApprovalStatusType } from "../constants";

export const memberStatusIcon = {
  ...approvalStatusIcon,
  "approval-pending": {
    variant: "solid",
    icon: Check,
  },
} as Record<
  ApprovalStatusType,
  {
    variant: ButtonVariant;
    icon: React.ComponentType<{ size?: number }> | null;
  }
>;

export const buttonVariants = cva("", {
  variants: {
    status: {
      "not-submitted": "",
      approved: "text-ink-green-4",
      rejected: "text-ink-red-4",
      "approval-pending": "text-ink-white",
      "partially-approved": "text-ink-green-4",
      "partially-rejected": "text-ink-red-4",
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
