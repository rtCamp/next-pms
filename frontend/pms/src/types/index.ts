import { TaskStatusType } from "@/store/task";

export type Employee = {
  name: string;
  image: string;
  employee_name: string;
};
export type WorkingFrequency = "Per Day" | "Per Week";

export interface TaskData {
  name: string;
  project: string;
  subject: string;
  project_name: string | null;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status:TaskStatusType;
  description: string | null;
  custom_is_billable: boolean;
  actual_time: number;
  due_date: string;
  expected_time: number;
  _liked_by: string;
}

export type ProjectProps = {
  project_name: string;
  name: string;
};

export interface ProjectNestedTaskData {
  project_name: string;
  name: string;
  tasks: TaskData[];
}

export interface ProjectData {
  projects: ProjectNestedTaskData[];
  count: number;
}

export type sortOrder = "asc" | "desc";

export type fieldMetaProps = {
  label: string;
  fieldname: string;
  fieldtype: string;
  options?: string;
}