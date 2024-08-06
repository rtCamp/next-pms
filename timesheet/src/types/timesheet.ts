import { WorkingFrequency } from "@/types"
export interface TaskProps {
    [key: string]: TaskDataProps
}
export interface TaskDataProps {
    name: string
    project_name: string | null
    is_billable: boolean
    data: Array<TaskDataItemProps>
}

export interface TaskDataItemProps {
    hours: number
    description: string
    name: string
    parent: string
    task: string
    from_time: string
    docstatus: 0 | 1 | 2
}

export interface LeaveProps {
    name: string
    from_date: string
    to_date: string
    status: string
    half_day: boolean
    half_day_date: string
}

export interface DynamicKey {
    [key: string]: timesheet;
}
export interface DataProp {
    working_hour: number;
    working_frequency: WorkingFrequency;
    data: DynamicKey;
}
export interface timesheet {
    start_date: string;
    end_date: string;
    key: string;
    dates: string[];
    total_hours: number;
    tasks: TaskProps
    leaves: Array<LeaveProps>;
    holidays: string[]
    status: string
}

export interface NewTimesheetProps {
    name: string;
    parent: string;
    task: string;
    date: string;
    description: string;
    hours: number;
    isUpdate: boolean;
    employee?: string;
}
