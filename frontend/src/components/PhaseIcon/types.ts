/** The colours a Project Phase can have (its `color` Select field). */
export const PROJECT_PHASE_COLORS = [
  "black",
  "gray",
  "blue",
  "green",
  "red",
  "pink",
  "orange",
  "amber",
  "yellow",
  "cyan",
  "teal",
  "violet",
  "purple",
] as const;

export type ProjectPhaseColor = (typeof PROJECT_PHASE_COLORS)[number];

export interface PhaseIconProps {
  /** The phase's colour. Default: `"gray"`. */
  color?: ProjectPhaseColor | null;
}
