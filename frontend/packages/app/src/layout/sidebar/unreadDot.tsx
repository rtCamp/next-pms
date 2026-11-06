/**
 * External dependencies.
 */
import { cva, type VariantProps } from "class-variance-authority";

const unreadDotVariants = cva("shrink-0 rounded-full bg-surface-blue-5", {
  variants: {
    placement: {
      logo: "absolute top-1 right-1 size-[9px] ring-2 ring-surface-menu-bar",
      menuItem: "size-[7px]",
    },
  },
});

type UnreadDotProps = Required<VariantProps<typeof unreadDotVariants>>;

export function UnreadDot({ placement }: UnreadDotProps) {
  return (
    <span aria-hidden="true" className={unreadDotVariants({ placement })} />
  );
}
