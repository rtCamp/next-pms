/**
 * External dependencies.
 */
import { cva } from "class-variance-authority";

/**
 * Internal dependencies.
 */
import { mergeClassNames } from "@/lib/utils";

const swatch = cva("inline-block size-2 rounded-full shrink-0", {
  variants: {
    tone: {
      paid: "bg-surface-gray-7",
      unpaid: "bg-surface-gray-5",
      remaining: "bg-surface-gray-3",
      green: "bg-surface-green-5",
      amber: "bg-surface-amber-5",
      red: "bg-surface-red-5",
    },
  },
  defaultVariants: { tone: "paid" },
});

export type LegendTone =
  | "paid"
  | "unpaid"
  | "remaining"
  | "green"
  | "amber"
  | "red";

type LegendRowProps = {
  tone: LegendTone;
  label: string;
  primary?: string;
  secondary?: string;
};

export function LegendRow({ tone, label, primary, secondary }: LegendRowProps) {
  return (
    <div className="flex items-center gap-2 text-base text-ink-gray-7">
      <span className={mergeClassNames(swatch({ tone }))} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {primary && (
        <span className="shrink-0 tabular-nums text-ink-gray-6">{primary}</span>
      )}
      {secondary && (
        <span className="shrink-0 tabular-nums text-ink-gray-8">
          {secondary}
        </span>
      )}
    </div>
  );
}
