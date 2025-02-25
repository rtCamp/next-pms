/**
 * Returns the Trim value of the given value.
 *
 * @param value The value to trim.
 * @param lenght The length of the string to trim, in characters.
 * @returns
 */
const getFilterValue = (
  value: string | number | undefined | boolean,
  lenght: number = 20
): string | number | boolean | undefined => {
  if (typeof value !== "string") {
    return value;
  }
  if (!value) {
    return "";
  }
  return value.length > lenght ? `${value.slice(0, lenght)}...` : value;
};

export { getFilterValue };
