import { useFrappeGetCall } from 'frappe-react-sdk'

interface TimesheetProp { 
    employee: string|null|undefined;
    start_date: string;
    max_weeks: number;
}
interface TimesheetData { 
    [key: string]: {
        start_date: string;
        end_date: string;
        key: string;
        dates: string[];
        tasks: object;
    };
}
export const getTimesheet = ({ employee, start_date, max_weeks }: TimesheetProp) => { 
    const { data, error, isLoading, isValidating, mutate } = useFrappeGetCall<{message:TimesheetData}>("timesheet_enhancer.api.timesheet.get_timesheet_data", {
        employee: employee,
        start_date: start_date,
        max_weeks: max_weeks,
    });
    if (isLoading || isValidating) {
        return null;
    }
    if (data) {
        return data;
      }
    if (error) {
        console.error(error);
    }

}
