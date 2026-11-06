/** A loaded motion: the animation a tip plays to show its task. Typed once motions are ported. */
export type MotionModule = unknown;

/** One how-to or tip in the Help panel. */
export interface HelpTip {
  /** Unique within its list; also the accordion item's value. */
  id: string;
  title: string;
  body: string;
  /** Numbered steps shown under the body, for how-to tips. */
  steps?: string[];
  /** Page and anchor under `WIKI_BASE`, e.g. "Team-Allocations#add-allocation". */
  wiki?: string;
  /** Lazy import of the motion that shows the task, played under the text. */
  motion?: () => Promise<MotionModule>;
  /** Only shown to users who hold one of these roles. */
  roles?: readonly string[];
}

export interface HelpPanelProps {
  /** Whether the panel is shown (`v-model:open`). */
  open?: boolean;
  /** Tips for the current page, listed under "On this page". */
  pageTips: HelpTip[];
  /** Tips for every page, listed under "Everywhere". */
  generalTips: HelpTip[];
  /** The user's roles, matched against each tip's `roles`. */
  roles: readonly string[];
}
