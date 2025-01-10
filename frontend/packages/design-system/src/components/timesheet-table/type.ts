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

