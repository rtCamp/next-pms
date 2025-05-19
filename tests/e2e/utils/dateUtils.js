/**
 * Gets the abbreviated weekday name (e.g., "Mon") from a Date object.
 */
export const getWeekdayName = (date) => {
  return date.toString().split(" ")[0];
};

// ------------------------------------------------------------------------------------------

/**
 * Gets the Date object for a given weekday.
 */
export const getDateForWeekday = (weekday) => {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const currentDayIndex = today.getDay();
  const targetDayIndex = weekdays.indexOf(weekday);
  const diff = targetDayIndex - currentDayIndex;
  const targetDate = new Date();

  targetDate.setDate(today.getDate() + diff);

  return targetDate;
};

// ------------------------------------------------------------------------------------------

/**
 * Formats a Date object into a string in the format YYYY-MM-DD.
 */
export const getFormattedDate = (date) => {
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  day = day < 10 ? "0" + day : day;
  month = month < 10 ? "0" + month : month;

  return `${year}-${month}-${day}`;
};

// ------------------------------------------------------------------------------------------

/**
 * Formats a Date object into a locale date string in the format MMM DD.
 */
export const getShortFormattedDate = (date) => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ------------------------------------------------------------------------------------------

/**
 * Converts a duration string (HH:MM or hours) to seconds.
 */
export const durationToSeconds = (duration) => {
  duration = duration.toString();

  if (duration === "-" || duration === "") {
    return 0;
  } else if (!duration.includes(":")) {
    return parseInt(duration) * 3600;
  } else {
    return parseInt(duration.split(":")[0]) * 3600 + parseInt(duration.split(":")[1]) * 60;
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Converts a duration from seconds into an "HH:MM" formatted string.
 */
export const secondsToDuration = (seconds) => {
  seconds = Number(seconds);

  var hours = Math.floor(seconds / 3600);
  var mins = Math.floor((seconds % 3600) / 60);

  return `${hours}:${mins}`;
};
// ------------------------------------------------------------------------------------------

/**
 * Get Yesterday's date in yyyy-mm-dd format
 */
export const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getFormattedDate(yesterday);
};
