/**
 * Internal dependencies.
 */
import type { MotionModule } from "../motion-player/kit";

export type HelpTip = {
  id: string;
  title: string;
  body: string;
  /** Numbered steps shown under the body, for how-to tips. */
  steps?: string[];
  wiki?: string;
  /** Lazy import of the motion that shows the task, played under the text. */
  motion?: () => Promise<MotionModule>;
  /** Only shown to users who hold one of these roles. */
  roles?: readonly string[];
};

export type HelpPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tips for the current page, listed under "On this page". */
  pageTips: HelpTip[];
  /** Tips for every page, listed under "Everywhere". */
  generalTips: HelpTip[];
  /** The user's roles, matched against each tip's `roles`. */
  roles: string[];
  className?: string;
};
