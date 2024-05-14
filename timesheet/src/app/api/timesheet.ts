import { useFrappeGetCall } from 'frappe-react-sdk'

interface TimesheetProp { 
    employee: string|null|undefined;
    start_date: string;
    max_weeks: number;
}
export interface TimesheetData { 
    [key: string]: {
        start_date: string;
        end_date: string;
        key: string;
        dates: string[];
        tasks: object;
    };
}
export const useFetchTimesheet = ({ employee, start_date, max_weeks }: TimesheetProp) => { 
 
    const res = useFrappeGetCall<{message:TimesheetData}>("timesheet_enhancer.api.timesheet.get_timesheet_data", {
        employee: employee,
        start_date: start_date,
        max_weeks: max_weeks,
    }, "timesheet_data",  {
        dedupingInterval: 1000 * 60 * 5, // 5 minutes - do not refetch if the data is fresh
    });
    return res;

}
