/** Day ranges offered by the range select, counted back from today. */
export const TASK_LOG_RANGES = [7, 15, 30, 60, 90, 180, 365] as const;

export const DEFAULT_TASK_LOG_RANGE = 15;

export const TASK_LOG_RANGE_OPTIONS = TASK_LOG_RANGES.map((days) => ({
  label: `Last ${days} days`,
  value: days,
}));
