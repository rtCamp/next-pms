export type Employee = {
    name: string;
    image: string;
    employee_name: string;
};
export type WorkingFrequency = "Per Day" | "Per Week";


export interface TaskData {
    name: string;
    subject: string;
    project_name: string | null;
    priority: "Low" | "Medium" | "High" | "Urgent";
    status: "Open" | "Working" | "Pending Review" | 'Overdue' | "Template" | "Completed" | "Cancelled";
    description: string | null;
    custom_is_billable: boolean;
}
