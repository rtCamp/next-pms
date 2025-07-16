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
// ------------------------------------------------------------------------------------------

/**
 * Get the Monday and Friday of the current week in 'YYYY-MM-DD' format.
 */
export const getWeekRange = () => {
  const today = new Date();
  const currentDay = today.getDay(); // Sunday: 0, Monday: 1, ..., Saturday: 6

  // Calculate how many days to subtract to get Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

  // Calculate how many days to add to get Friday
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    monday: getFormattedDate(monday),
    friday: getFormattedDate(friday),
  };
};

/**
 * Get the current date in 'Jun 6' or 'Jun 11' format.
 */
export const getFormattedCurrentDate = () => {
  const today = new Date();
  const options = { month: "short", day: "numeric" };
  const formattedDate = today.toLocaleDateString("en-US", options);
  return formattedDate;
};

/**
 * Get the date n days from today in 'Jun 6' format along with day of the week as 'Wed'.
 * If the resulting day is Sat or Sun, move it to the next Monday.
 */
export const getFormattedDateNDaysFromToday = (n) => {
  const date = new Date();
  date.setDate(date.getDate() + n);

  // Adjust weekend days to Monday
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 6) {
    // Saturday
    date.setDate(date.getDate() + 2);
  } else if (dayOfWeek === 0) {
    // Sunday
    date.setDate(date.getDate() + 1);
  }

  return {
    date: getShortFormattedDate(date),
    day: getWeekdayName(date),
  };
};

/**
 * Get the date of the past workday based on the given offset.
 * If the resulting day is Sat or Sun, move it to the previous Friday.
 */
export const getFormattedPastWorkday = (offset) => {
  let date = new Date();
  date.setDate(date.getDate() + offset);

  // Move back to Friday if it's Saturday or Sunday
  while (date.getDay() === 6 || date.getDay() === 0) {
    date.setDate(date.getDate() - 1);
  }

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const dayOfWeek = date.toLocaleDateString("en-US", {
    weekday: "short",
  });

  return {
    date: formattedDate, // e.g., "Jul 08"
    day: dayOfWeek, // e.g., "Mon"
  };
};
