// Gantt layout constants
export const COLUMN_WIDTH = 38; // px per day column
export const WEEK_LABEL_HEIGHT = 30; // px – week range row
export const DAY_HEADER_HEIGHT = 30; // px – day numbers row
export const ROW_HEIGHT = 60; // px – each item row
export const MIN_CARD_DAYS = 1; // minimum card width in days
export const FLOATING_LABEL_FLIP_THRESHOLD = 150; // px – space needed on the right before a floating label flips left
// Bars this narrow (a single-day span) can't fit their label inside, so the
// label floats outside the icon chip instead of truncating.
export const MIN_BAR_WIDTH = COLUMN_WIDTH * MIN_CARD_DAYS;

// Calendar grid constants
export const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// List view constants
export const TIMELINE_LIST_PAGE_SIZE = 20;
