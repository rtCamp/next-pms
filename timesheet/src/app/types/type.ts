export interface Task {
  name: string;
  subject: string;
  status: string;
  project_name: string;
}

export interface EmployeeProps {
  name: string;
  employee_name: string;
  image: string;
}

export interface DialogInput {
  employee: string
  task: string
  hours: string
  description: string
  date: string
  is_update: boolean
}
