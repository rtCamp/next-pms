export type ProgressV2Props = {
  value: number;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  label?: string;
  hint?: React.ReactNode;
  intervals?: boolean;
  intervalCount?: number;
  className?: string;
  /** Tailwind background class for overflow portion when value > 100% */
  overflowColor?: string;
};
