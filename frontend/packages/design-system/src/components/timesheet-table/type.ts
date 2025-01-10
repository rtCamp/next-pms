export type TaskDataItemProps = {
    hours: number;
    description: string;
    name: string;
    parent: string;
    is_billable: boolean | number;
    task: string;
    from_time: string;
    to_time?: string;
    docstatus: 0 | 1 | 2;
    subject?: string;
    project?: string;
    project_name?: string | null;
}

export type HolidayProps = {
    description: string;
    holiday_date: string;
    weekly_off: boolean;
}
export type LeaveProps = {
    name: string;
    from_date: string;
    to_date: string;
    status: string;
    half_day: boolean;
    half_day_date: string;
}
export type WorkingFrequency = "Per Day" | "Per Week";


export interface TaskProps {
    [key: string]: TaskDataProps;
}

export interface TaskDataProps {
    name: string;
    subject: string;
    project_name: string | null;
    is_billable: boolean;
    project: string;
    expected_time: number;
    actual_time: number;
    status: string;
    data: Array<TaskDataItemProps>;
}
