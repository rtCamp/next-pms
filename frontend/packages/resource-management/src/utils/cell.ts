/**
 * External dependencies.
 */
import { isToday } from "date-fns";

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
 * Table cell base class.
 *
 * @returns string
 */
const getTableCellRow = () => {
  return "flex items-center w-full";
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

export { getTableCellClass, getTableCellRow, getTodayDateCellClass };
