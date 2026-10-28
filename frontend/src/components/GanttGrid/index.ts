export { default as GanttGrid } from "./GanttGrid.vue";
export { default as GanttBar } from "./GanttBar.vue";
export type { BarVariant } from "./GanttBar.vue";
export { default as GanttTimeoffBar } from "./GanttTimeoffBar.vue";
export type * from "./types";
export {
  BAR_HEIGHT,
  CELL_HEIGHT,
  CELL_WIDTH,
  DAY_HEADER_HEIGHT,
  WEEK_LABEL_HEIGHT,
} from "./constants";
export {
  buildTimeline,
  columnIndex,
  type Timeline,
  type TimelineDay,
  type TimelineWeek,
} from "./geometry";
