/**
 * External dependencies.
 */
import * as React from "react";
import { type VariantProps } from "class-variance-authority";
/**
 * Internal dependencies.
 */
import { badgeVariants } from "./badgeVariants";
import { mergeClassNames } from "../../utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return <div className={mergeClassNames(badgeVariants({ variant }), className)} {...props} />;
};
export default Badge;
