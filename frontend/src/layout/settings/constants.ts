const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** The reminder day options of `Timesheet Settings`. */
export const WEEK_DAY_OPTIONS = WEEK_DAYS.map((day) => ({
  label: day,
  value: day,
}));
