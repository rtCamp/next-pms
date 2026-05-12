/**
 * External dependencies.
 */
import { SolidStages } from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";

const stagesIconVariants = cva("size-4 shrink-0", {
  variants: {
    phase: {
      "Delivery Prep": "text-ink-gray-4",
      "Kick Off": "text-ink-blue-3",
      Discovery: "text-ink-amber-3",
      Development: "text-ink-cyan-3",
      Launch: "text-ink-green-3",
      "Close Out": "text-ink-violet-3",
    },
  },
});

type StagesIconProps = VariantProps<typeof stagesIconVariants>;

export function StagesIcon({ phase }: StagesIconProps) {
  return <SolidStages className={stagesIconVariants({ phase })} />;
}
