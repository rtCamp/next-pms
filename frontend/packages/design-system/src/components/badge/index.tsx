/**
 * External dependencies.
 */
import * as React from "react";
import { type VariantProps } from "class-variance-authority";
/**
 * Internal dependencies.
 */
import { cn } from "@/utils";
import { badgeVariants } from "./badgeVariants";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
};
export default Badge;
