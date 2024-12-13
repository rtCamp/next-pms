const getFormatedStringValue = (
  value: string | undefined | number
): string | number => {
  if (typeof value === "number") {
    return value;
  }
  if (value === undefined || value === null) {
    return "";
  }

  return value;
};

export { getFormatedStringValue };
