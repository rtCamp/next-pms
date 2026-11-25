import type { HelpTip } from "./types";

/** The tips a user holding `roles` (roles and capabilities) may see: those without `roles`, or sharing one of them. */
export function visibleTips(
  tips: readonly HelpTip[],
  roles: readonly string[],
): HelpTip[] {
  return tips.filter(
    (tip) => !tip.roles || tip.roles.some((role) => roles.includes(role)),
  );
}
