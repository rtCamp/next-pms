import React, { ElementType } from "react";
type Variant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "p"
  | "large"
  | "small"
  | "muted";

interface Props {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
}

const tags: Record<Variant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  p: "p",
  large: "p",
  muted: "p",
  small: "span",
};

const sizes: Record<Variant, string> = {
  h1: "text-4xl font-bold sm:text-3xl",
  h2: "text-3xl font-bold sm:text-2xl",
  h3: "text-2xl font-bold sm:text-xl",
  h4: "text-xl font-bold sm:text-lg",
  h5: "sm:text-lg font-bold text-base",
  p: "sm:text-base font-normal text-sm",
  large: "text-lg sm:text-md font-bold",
  muted: "text-muted-foreground text-sm font-normal",
  small: "text-sm font-normal",
};

export const Typography = ({ variant, children, className="", as }: Props) => {
  const sizeClasses = sizes[variant];
  const Tag = as || tags[variant];

  return <Tag className={`${sizeClasses} ${className}`}>{children}</Tag>;
};
