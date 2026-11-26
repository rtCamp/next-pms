/** Height of a grid row, in px. */
export const CELL_HEIGHT = 60;
/** Default width of a day column, in px; the minimum when columns stretch. */
export const CELL_WIDTH = 38;
export const WEEK_LABEL_HEIGHT = 30;
export const DAY_HEADER_HEIGHT = 30;
export const HEADER_HEIGHT = WEEK_LABEL_HEIGHT + DAY_HEADER_HEIGHT;
export const BAR_HEIGHT = 32;
/** Gap between neighbouring bars, split between their two sides. */
export const BAR_MARGIN = 2;
/** Default width of the row header column, in px. */
export const ROW_HEADER_WIDTH = 240;
export const MIN_ROW_HEADER_WIDTH = 120;
/** Height of the "Add project" / "Add member" row. */
export const ADD_ROW_HEIGHT = 40;
/** Hours a day is assumed to have when an employee has no capacity set. */
export const FULL_DAY_HOURS = 8;
/** Columns stretch to fill the width when this many weeks or fewer are shown. */
export const MAX_STRETCH_WEEKS = 4;
/** Skeleton rows shown while a page of rows loads. */
export const LOADING_ROW_COUNT = 10;
/** Expand / collapse animation of child rows, in ms. */
export const COLLAPSE_DURATION_MS = 200;
/** How long the pointer rests on a bar before its card opens, in ms. */
export const BAR_CARD_DELAY_MS = 400;
/** How long the pointer rests on a row header before its card opens, in ms. */
export const ROW_CARD_DELAY_MS = 300;
export const CARD_LEAVE_DELAY_MS = 150;
/** Debounce for the scroll area's width changes, in ms. */
export const RESIZE_DEBOUNCE_MS = 300;
/** A bar cut off by the right edge of the range is drawn this much shorter. */
export const RIGHT_TRIM_WIDTH_REDUCTION = 3;
