import { formatISO, parseISO, format, isToday, isYesterday } from 'date-fns';

export const getUTCDateTime = (
    date: string | Date = "",
): Date => {
    if (!date) {
        return parseISO(formatISO(new Date(), { representation: 'complete' }));
    }
    if (typeof date == "string") {
        date = new Date(date + "T00:00:00");
    }
    return date;
}


export const getFormatedDate = (date: string | Date): string => {
    date = getUTCDateTime(date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export const getTodayDate = (): string => {
    const today = new Date();
    return getFormatedDate(today);
}

export const prettyDate = (dateString: string, isLong: boolean = false) => {
    const date = getUTCDateTime(dateString);
    const month = date.toLocaleString("default", { month: "short" });
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.toLocaleString("default", {
        weekday: !isLong ? "short" : "long",
    });
    return { date: `${month} ${dayOfMonth}`, day: dayOfWeek };
}

export const getDateFromDateAndTimeString = (dateTimeString: string): string => {
    // Split the date and time parts exa: '2024-05-08 00:00:00'
    const parts = dateTimeString.split(" ");
    return parts[0];
}

export const normalizeDate = (date: string): string => {
    const parts = date.split("-");
    if (parts.length === 3) {
        let [year, month, day] = parts;
        if (year.length < 4) {
            year = getUTCDateTime().getFullYear().toString();
        }
        if (month.length === 1) {
            month = `0${month}`;
        }
        if (day.length === 1) {
            day = `0${day}`;
        }
        return `${year}-${month}-${day}`;
    }
    return getFormatedDate(getUTCDateTime());
}

export const getDisplayDate = (date: Date): string => {
    const utcDate = getUTCDateTime(date);
    if (isToday(utcDate)) return "Today";
    if (isYesterday(utcDate)) return "Yesterday";
    return format(utcDate, "MMM d");
};