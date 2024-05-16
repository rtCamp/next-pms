export interface TaskData {
    parent: string;
    task: string;
    hours: number;
    name: string;
    description: string;
  }
export interface TimesheetProp extends TaskData {
    date: string;
    isUpdate: boolean;
  }
