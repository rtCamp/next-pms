/**
 * External dependencies.
 */

import { DateProps } from "@/store/resource_management/team";
import {
  getFormatedDate,
  getMonthKey,
  getTodayDate,
  getUTCDateTime,
} from "@next-pms/design-system/date";
import { startOfWeek } from "date-fns";
import { Moment } from "moment";

function getDatesArrays(
  startDate: string,
  weeks: number,
  ignoreWeekends: boolean = true
) {
  const dates = [];
  const start = startOfWeek(getUTCDateTime(startDate), {
    weekStartsOn: 1,
  });
  const today = getTodayDate();

  for (let weekCount = 0; weekCount < weeks; weekCount++) {
    const datesObject: DateProps = {
      start_date: "",
      end_date: "",
      dates: [],
      key: "",
    };
    const currentDayOfWeek = start;
    let key = "";

    datesObject.start_date = getFormatedDate(currentDayOfWeek);

    for (let date = 0; date < 7; date++) {
      const dateString = getFormatedDate(currentDayOfWeek);

      if (dateString === today) {
        key = "This Week";
      }
      if (
        ignoreWeekends &&
        (currentDayOfWeek.getDay() === 0 || currentDayOfWeek.getDay() === 6)
      ) {
        currentDayOfWeek.setDate(currentDayOfWeek.getDate() + 1);
        continue;
      }

      datesObject.dates.push(dateString);
      currentDayOfWeek.setDate(currentDayOfWeek.getDate() + 1);
    }

    datesObject.end_date = datesObject.dates[datesObject.dates.length - 1];
    datesObject.key = key
      ? key
      : `${getMonthKey(datesObject.start_date)} - ${getMonthKey(
          datesObject.end_date
        )}`;

    dates.push(datesObject);
  }

  return dates;
}

const getDayKeyOfMoment = (dateTime: Moment): string => {
  return dateTime.format("YYYY-MM-DD");
};

export { getDatesArrays, getDayKeyOfMoment };
