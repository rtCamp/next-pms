/**
 * Based on value type retunr the empty string.
 *
 * @param value The value to be formatted.
 * @returns string
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

export { getFormatedStringValue };
