import {
  getUTCDateTime,
  getFormatedDate,
  getTodayDate,
} from "@next-pms/design-system/date";
import { startOfWeek } from "date-fns";
import { DateProps } from "@/store/resource_management/team";

const Months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getDatesArrays(
  startDate: string,
  weeks: number,
  ignoreWeekends: boolean = true
) {
  const dates = [];
  const start = startOfWeek(getUTCDateTime(startDate), {
    weekStartsOn: 1,
  });
  const today = getTodayDate()

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

function getNextDate(startDate: string, weeks: number) {
  const start = startOfWeek(getUTCDateTime(startDate), {
    weekStartsOn: 1,
  });

  start.setDate(start.getDate() + weeks * 7);

  return getFormatedDate(start);
}

function getMonthKey(dateString: string) {
  const date = getUTCDateTime(dateString);
  return `${Months[date.getMonth()]} ${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()
    }`;
}

function checkInRange(start: string, weeks: number, dateString: string) {
  const startDate = getFormatedDate(
    startOfWeek(getUTCDateTime(start), {
      weekStartsOn: 1,
    })
  );

  const endDate = getNextDate(startDate, weeks);

  return startDate <= dateString && dateString <= endDate;
}

export { getDatesArrays, getNextDate, checkInRange };
