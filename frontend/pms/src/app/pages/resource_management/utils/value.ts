/**
 * Based on value type retunr the empty string.
 *
 * @param value The value to be formatted.
 * @returns string
 */
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

interface DateProps {
  message: any;
}

/**
 * Merge the arrays to make final properties.
 *
 * @param dataList List of objects array
 * @returns
 */
const getMergeData = (dataList: DateProps[]) => {
  if (dataList.length == 0) {
    return {};
  }

  let allData: [] = dataList[0].message;

  for (let index = 1; index < dataList.length; index++) {
    let currentData: any = dataList[index].message;

    for (const key in currentData) {
      let data: any = currentData[key];

      if (Array.isArray(data)) {
        if (key != "data") {
          allData[key] = data;
          continue;
        }

        allData[key] = [...allData[key], ...data];
      } else if (typeof data == "object") {
        allData[key] = { ...allData[key], ...data };
      } else {
        allData[key] = data;
      }
    }
  }
  return allData;
};

export { getFormatedStringValue, getMergeData };
