
export interface TaskDataProps {
    name: string
    project_name: string | null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface LeaveProps{
    name: string
    from_date: string
    to_date: string
    status: string
    half_day: boolean
    half_day_date: string
}
