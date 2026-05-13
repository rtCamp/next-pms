/**
 * External dependencies.
 */
import { SolidStages } from "@rtcamp/frappe-ui-react/icons";
import { cva, type VariantProps } from "class-variance-authority";
import { Phase } from "../types";

const stagesIconVariants = cva("size-4 shrink-0", {
  variants: {
    phase: {
      "delivery-prep": "text-ink-gray-4",
      "kick-off": "text-ink-blue-3",
      discovery: "text-ink-amber-3",
      development: "text-ink-cyan-3",
      launch: "text-ink-green-3",
      "close-out": "text-ink-violet-3",
    } satisfies Record<Phase, string>,
  },
});

export type StagesIconProps = VariantProps<typeof stagesIconVariants>;

export function StagesIcon({ phase }: StagesIconProps) {
  return <SolidStages className={stagesIconVariants({ phase })} />;
}
