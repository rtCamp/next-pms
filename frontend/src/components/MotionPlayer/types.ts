import type { MotionModule } from "./kit";

/** Lazy import of a motion, e.g. `() => import("@/assets/motions/add-time?motion")`. */
export type MotionLoader = () => Promise<MotionModule>;

export interface MotionPlayerProps {
  /** Lazy import of the motion to play. */
  load: MotionLoader;
  /** What the motion shows, for screen readers. */
  label: string;
  /** Freezes playback from outside, e.g. while the enlarged view is open. */
  paused?: boolean;
  /** Shows an Enlarge button, and selecting the picture enlarges instead of pausing; emits `expand`. */
  expandable?: boolean;
  /** Shows a Shrink button; emits `collapse`. */
  collapsible?: boolean;
}

export interface MotionPlayerEmits {
  expand: [];
  collapse: [];
}

export interface MotionDialogPlayerProps {
  /** Lazy import of the motion to play. */
  motion: MotionLoader;
  /** The motion's title: its accessible name and the enlarged view's heading. */
  title: string;
}

export type { MotionModule } from "./kit";
