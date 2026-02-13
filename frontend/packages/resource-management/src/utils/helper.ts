/**
 * Trims the given string to the specified length.
 *
 * @param value The value to trim.
 * @param lenght The length of the string to trim, in characters.
 * @returns The trimmed string or the original value
 */
const getFilterValue = (
  value: string | number | undefined | boolean,
  lenght: number = 20,
): string | number | boolean | undefined => {
  if (typeof value !== "string") {
    return value;
  }
  if (!value) {
    return "";
  }
  return value.length > lenght ? `${value.slice(0, lenght)}...` : value;
};

/**
 * Return an empty string based on the value type.
 *
 * @param value value The value to be formatted.
 * @returns The formatted string.
 */
const getFormatedStringValue = (value: string | undefined | number): string => {
  if (typeof value === "number") {
    return value.toString();
  }
  if (value === undefined || value === null) {
    return "";
  }

  return value;
};

export { getFilterValue, getFormatedStringValue };
