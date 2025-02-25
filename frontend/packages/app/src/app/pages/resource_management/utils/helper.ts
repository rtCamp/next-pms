/**
 * External dependencies.
 */
import { isToday } from "date-fns";

/**
 * Internal dependencies.
 */
import { store } from "@/store";
import { DateProps } from "../../team/reducer";

/**
 * Genrate th cell css based on cell and week index.
 *
 * @param index The index of the cell
 * @param weekIndex The index of the week
 * @returns string
 */
const getTableCellClass = (index: number, weekIndex: number = 0) => {
  //   return "flex max-w-20 w-full justify-center items-center border-r border-b border-gray-400";

  let className = "";

  if (index == 4) {
    className = "border-r border-gray-300";
  }

  if (index == 0 && weekIndex == 0) {
    className += " border-l border-gray-300";
  }

  return className;
};

/**
 * Get the today date class name.
 *
 * @param date The date string
 * @returns
 */
const getTodayDateCellClass = (date: string): string => {
  if (isToday(date)) {
    return "bg-opacity-90 font-semibold border-l border-r border-gray-300 opacity-80";
  }
  return "";
};

/**
 * Remove the specified item from the array
 *
 * @param value The item to be removed
 * @param array The array.
 * @returns array
 */
const removeValueFromArray = (value: string, array: string[] | undefined) => {
  if (!array) {
    return [];
  }
  return array.filter((itemvalue: string) => itemvalue != value);
};

/**
 * Get the billable flag values based on allocation type.
 *
 * @param value The array of filter of allocation type.
 * @returns number
 */
const getIsBillableValue = (value: string[]) => {
  if (value.length == 2 || value.length == 0) {
    return "-1";
  } else if (value[0] == "Billable") {
    return "1";
  } else {
    return "0";
  }
};

/**
 * Find the number of days for given range exculating weekends.
 *
 * @param start
 * @param end
 * @returns Number of days exculating weekends.
 */
const daysDiff = (start: string | Date, end: string | Date) => {
  if (typeof start === "string") {
    start = new Date(start);
  }
  if (typeof end === "string") {
    end = new Date(end);
  }

  const diff = end.getTime() - start.getTime();

  if (diff == 0) {
    return 0;
  }

  let weekendDays: number = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) {
      weekendDays++;
    }
  }
  return Math.floor(diff / (1000 * 60 * 60 * 24)) - weekendDays;
};

/**
 * Get the relative start date based on the state dates and provided start date.
 *
 * @param start The start date.
 * @returns string
 */
const getRelativeStartDate = (start: string) => {
  const state = store.getState();
  const resourceTeamStateDates: DateProps[] = state.resource_team.data.dates;

  if (
    resourceTeamStateDates.length != 0 &&
    resourceTeamStateDates[0].start_date > start
  ) {
    return resourceTeamStateDates[0].start_date;
  }
  return start;
};

/**
 * Get the relative end date based on the state dates and provided end date.
 *
 * @param end The end date.
 * @returns
 */
const getRelativeEndDate = (end: string): string => {
  const state = store.getState();
  const resourceTeamStateDates: DateProps[] = state.resource_team.data.dates;

  if (
    resourceTeamStateDates.length != 0 &&
    resourceTeamStateDates[resourceTeamStateDates.length - 1].end_date < end
  ) {
    return resourceTeamStateDates[resourceTeamStateDates.length - 1].end_date;
  }
  return end;
};

/**
 * Table cell base class.
 *
 * @returns string
 */
const getTableCellRow = () => {
  return "flex items-center w-full";
};

/**
 * Get the combination of first character of each word in the name.
 *
 * @param name The name to get the initials.
 * @returns
 */
const getInitials = (name: string) => {
  const words: string[] = name.split(" ");
  const initials = words.map((word) => word[0]).join("");
  return initials;
};

/**
 * Round of values till 2 decimal points.
 *
 * @param value number which need to be round off.
 * @returns number
 */
const getRoundOfValue = (value: number): number => {
  return Math.round(value * 100) / 100;
};

export {
  daysDiff,
  getInitials,
  getIsBillableValue,
  getRelativeEndDate,
  getRelativeStartDate,
  getRoundOfValue,
  getTableCellClass,
  getTodayDateCellClass,
  getTableCellRow,
  removeValueFromArray,
};
