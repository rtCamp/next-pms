import type { HelpTip } from "./types";

/** The tips a user with `roles` may see: those without `roles`, or sharing one of them. */
export function visibleTips(
  tips: readonly HelpTip[],
  roles: readonly string[],
): HelpTip[] {
  return tips.filter(
    (tip) => !tip.roles || tip.roles.some((role) => roles.includes(role)),
  );
}
