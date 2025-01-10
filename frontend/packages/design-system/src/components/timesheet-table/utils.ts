import { HolidayProps, WorkingFrequency } from './type';

export const getHolidayList = (holidays: Array<HolidayProps>) => {
    return holidays.map((holiday) => {
        return holiday.holiday_date;
    });
};

export const expectatedHours = (expected_hours: number, frequency: WorkingFrequency
): number => {
    if (frequency === "Per Day") {
        return expected_hours;
    }
    return expected_hours / 5;
};
export function calculateWeeklyHour(expected_hours: number, frequency: WorkingFrequency
) {
    if (frequency === "Per Day") {
        return expected_hours * 5;
    } else {
        return expected_hours;
    }

}